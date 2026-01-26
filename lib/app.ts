import path from "node:path";
import cookieParser from "cookie-parser";
import { Effect, Exit } from "effect";
import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import {
	generateLoginPageHtml,
	generateNotAMemberPageHtml,
	getUserForErrorPage,
	handleCookieRequest,
	handleLogoutRequest,
	type PocketBaseAuthOptions,
	requestErrorToResponse,
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
 * Creates the Express app for Docker deployment
 */
export function createApp() {
	const pocketbaseUrl = process.env.POCKETBASE_URL;
	const groupField = process.env.POCKETBASE_GROUP;

	if (!pocketbaseUrl) {
		throw new Error("POCKETBASE_URL environment variable is required");
	}
	if (!groupField) {
		throw new Error("POCKETBASE_GROUP environment variable is required");
	}

	const options: PocketBaseAuthOptions = {
		pocketbaseUrl,
		pocketbaseUrlMicrosoft: process.env.POCKETBASE_URL_MICROSOFT,
		groupField,
	};

	return express()
		.use(cookieParser())
		.use("/api", express.json())
		.post("/api/cookie", async (req: Request, res: Response) => {
			const webRequest = toWebRequest(req);
			const exit = await Effect.runPromiseExit(
				handleCookieRequest(webRequest, options.pocketbaseUrl),
			);

			if (Exit.isSuccess(exit)) {
				await sendWebResponse(exit.value, res);
			} else {
				const cause = exit.cause;
				if (cause._tag === "Fail" && cause.error._tag === "RequestError") {
					await sendWebResponse(requestErrorToResponse(cause.error), res);
				} else {
					res.status(500).json({ error: "Unknown error" });
				}
			}
		})
		.post("/api/logout", async (_req: Request, res: Response) => {
			const webResponse = handleLogoutRequest("/");
			await sendWebResponse(webResponse, res);
		})
		.use(async (req: Request, res: Response, next: NextFunction) => {
			const webRequest = toWebRequest(req);
			const exit = await Effect.runPromiseExit(verifyAuth(webRequest, options));

			if (Exit.isSuccess(exit)) {
				// User is authenticated and authorized
				return next();
			}

			// Handle auth errors
			const cause = exit.cause;
			if (cause._tag === "Fail" && cause.error._tag === "AuthError") {
				const error = cause.error;

				switch (error.reason) {
					case "NoCookie":
					case "InvalidCookie":
					case "AuthRefreshFailed":
					case "NoUserRecord":
						return res
							.status(401)
							.send(
								generateLoginPageHtml(
									options.pocketbaseUrl,
									options.pocketbaseUrlMicrosoft,
								),
							);

					case "NotInRequiredGroup":
					case "GroupCheckFailed": {
						// Try to get user email for better error message
						// Use the shared Effect-based helper from index.ts
						const userExit = await Effect.runPromiseExit(
							getUserForErrorPage(webRequest, options),
						);
						const userEmail = Exit.isSuccess(userExit)
							? userExit.value.email
							: "unknown";
						return res
							.status(403)
							.send(
								generateNotAMemberPageHtml(
									userEmail,
									options.groupField,
									options.pocketbaseUrl,
								),
							);
					}
				}
			}

			// Unknown error - show login page
			return res
				.status(401)
				.send(
					generateLoginPageHtml(
						options.pocketbaseUrl,
						options.pocketbaseUrlMicrosoft,
					),
				);
		})
		.use(express.static(path.join(__dirname, "/build")));
}

// Only start server when run directly, not when imported
if (import.meta.url === `file://${process.argv[1]}`) {
	const app = createApp();
	const PORT = process.env.PORT || 3000;

	app.listen(PORT, () => {
		console.log(`Server is running on http://localhost:${PORT}`);
	});
}
