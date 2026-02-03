import path from "node:path";
import cookieParser from "cookie-parser";
import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import {
	type AuthMode,
	generateLoginPageHtmlWithRedirect,
	generateNotAMemberPageHtml,
	handleCookieRequest,
	handleLogoutRequest,
	handleVerifyRequest,
	type PocketBaseAuthOptions,
	verifyAuth,
} from "./index.ts";

const __dirname = import.meta.dirname;

/**
 * Bridge function to convert Express req to Web Request
 */
function toWebRequest(req: Request): globalThis.Request {
	const protocol = req.protocol;
	const host = req.get("host") || "localhost";
	const url = `${protocol}://${host}${req.originalUrl}`;

	const headers = new Headers();
	for (const [key, value] of Object.entries(req.headers)) {
		if (typeof value === "string") {
			headers.set(key, value);
		} else if (Array.isArray(value)) {
			headers.set(key, value.join(", "));
		}
	}

	return new globalThis.Request(url, {
		method: req.method,
		headers,
		body:
			req.method !== "GET" && req.method !== "HEAD"
				? JSON.stringify(req.body)
				: undefined,
	});
}

/**
 * Bridge function to send Web Response via Express res
 */
async function sendWebResponse(
	webResponse: globalThis.Response,
	res: Response,
): Promise<void> {
	res.status(webResponse.status);

	webResponse.headers.forEach((value, key) => {
		res.setHeader(key, value);
	});

	const body = await webResponse.text();
	res.send(body);
}

/**
 * Extend Express Request to include user info after auth
 */
declare global {
	namespace Express {
		interface Request {
			authUser?: { id: string; email: string };
		}
	}
}

/**
 * Creates the Express app for Docker deployment
 */
export function createApp() {
	const pocketbaseUrl = process.env.POCKETBASE_URL;
	const groupField = process.env.POCKETBASE_GROUP;
	const authMode = (process.env.AUTH_MODE || "static") as AuthMode;
	const upstreamUrl = process.env.UPSTREAM_URL;
	const allowedRedirectDomains = process.env.ALLOWED_REDIRECT_DOMAINS;
	const publicUrl = process.env.PUBLIC_URL;

	if (!pocketbaseUrl) {
		throw new Error("POCKETBASE_URL environment variable is required");
	}
	if (!groupField) {
		console.log(
			"POCKETBASE_GROUP not set - group membership check disabled",
		);
	}
	if (authMode === "proxy" && !upstreamUrl) {
		throw new Error(
			"UPSTREAM_URL environment variable is required when AUTH_MODE=proxy",
		);
	}

	const options: PocketBaseAuthOptions = {
		pocketbaseUrl,
		pocketbaseUrlMicrosoft: process.env.POCKETBASE_URL_MICROSOFT,
		groupField: groupField || undefined,
		authMode,
		upstreamUrl,
		allowedRedirectDomains,
		publicUrl,
	};

	const app = express()
		.use(cookieParser())
		.use("/api", express.json());

	// ForwardAuth verify endpoint - returns 200/401/403 with headers
	app.get("/auth/verify", async (req: Request, res: Response) => {
		const webRequest = toWebRequest(req);
		const webResponse = await handleVerifyRequest(webRequest, options);
		await sendWebResponse(webResponse, res);
	});

	// Login page with optional redirect parameter
	app.get("/login", (req: Request, res: Response) => {
		const redirectUrl = req.query.rd as string | undefined;
		res
			.status(200)
			.send(
				generateLoginPageHtmlWithRedirect(
					options.pocketbaseUrl,
					options.pocketbaseUrlMicrosoft,
					redirectUrl,
					options.allowedRedirectDomains,
					options.publicUrl,
				),
			);
	});

	// API endpoints
	app.post("/api/cookie", async (req: Request, res: Response) => {
		const webRequest = toWebRequest(req);
		const webResponse = await handleCookieRequest(
			webRequest,
			options.pocketbaseUrl,
		);
		await sendWebResponse(webResponse, res);
	});

	app.post("/api/logout", async (_req: Request, res: Response) => {
		const webResponse = handleLogoutRequest("/");
		await sendWebResponse(webResponse, res);
	});

	// Auth middleware for protected routes
	const authMiddleware = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const webRequest = toWebRequest(req);
		const result = await verifyAuth(webRequest, options);

		if (!result.isAuthenticated) {
			// In forwardauth mode, the login redirect is handled by Traefik
			// So we just return 401 status
			if (authMode === "forwardauth") {
				return res.status(401).send("Unauthorized");
			}

			// In static/proxy mode, show login page
			const redirectUrl =
				authMode === "proxy" ? `${req.protocol}://${req.get("host")}${req.originalUrl}` : undefined;
			return res
				.status(401)
				.send(
					generateLoginPageHtmlWithRedirect(
						options.pocketbaseUrl,
						options.pocketbaseUrlMicrosoft,
						redirectUrl,
						options.allowedRedirectDomains,
						options.publicUrl,
					),
				);
		}

		if (!result.isAuthorized && result.user) {
			return res
				.status(403)
				.send(
					generateNotAMemberPageHtml(
						result.user.email,
						options.groupField,
						options.pocketbaseUrl,
					),
				);
		}

		// Store user info on request for proxy mode
		if (result.user) {
			req.authUser = result.user;
		}

		return next();
	};

	// Apply auth middleware and either proxy or static file serving
	if (authMode === "proxy" && upstreamUrl) {
		// Proxy mode: forward authenticated requests to upstream
		const proxyMiddleware = createProxyMiddleware({
			target: upstreamUrl,
			changeOrigin: true,
			ws: true, // WebSocket support
			on: {
				proxyReq: (proxyReq, req) => {
					// Add user info headers to upstream
					const expressReq = req as Request;
					if (expressReq.authUser) {
						proxyReq.setHeader("X-Auth-User", expressReq.authUser.id);
						proxyReq.setHeader("X-Auth-Email", expressReq.authUser.email || "");
					}
					if (groupField) {
						proxyReq.setHeader("X-Auth-Groups", groupField);
					}
				},
			},
		});

		app.use("/", authMiddleware, proxyMiddleware);
	} else {
		// Static mode (default): serve static files after auth
		app.use(authMiddleware);
		app.use(express.static(path.join(__dirname, "/build")));
	}

	return app;
}

// Only start server when run directly, not when imported
if (import.meta.url === `file://${process.argv[1]}`) {
	const app = createApp();
	const PORT = process.env.PORT || 3000;

	app.listen(PORT, () => {
		console.log(`Server is running on http://localhost:${PORT}`);
	});
}
