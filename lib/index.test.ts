import type { Express } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";

// Mock environment variables
vi.mock("dotenv", () => ({
	default: {
		config: () => {},
	},
}));

// Track auth store validity for testing
let mockAuthStoreIsValid = false;

// Mock PocketBase
const mockAuthStore = {
	loadFromCookie: vi.fn(),
	clear: vi.fn(),
	exportToCookie: vi.fn(() => "pb_auth=mock-cookie; Path=/; HttpOnly"),
	save: vi.fn(),
	token: "mock-token",
	record: { id: "user-id", email: "test@example.com" },
	get isValid() {
		return mockAuthStoreIsValid;
	},
};

const mockCollection = vi.fn(() => ({
	authRefresh: vi.fn(),
	authLogout: vi.fn(),
	authWithOAuth2: vi.fn(),
	getFirstListItem: vi.fn(() => ({ testGroup: true })),
}));

vi.mock("pocketbase", () => {
	return {
		default: vi.fn(() => ({
			authStore: mockAuthStore,
			collection: mockCollection,
		})),
	};
});

// Mock hbs
vi.mock("hbs", () => ({
	default: {
		__express: vi.fn((_path, _options, callback) => {
			// Mock template rendering
			callback(null, "<html><body>Bitte einloggen</body></html>");
		}),
	},
}));

// Mock http-proxy-middleware
vi.mock("http-proxy-middleware", () => ({
	createProxyMiddleware: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
}));

describe("App functionality", () => {
	let app: Express;

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks();
		mockAuthStoreIsValid = false;

		// Set up environment variables
		process.env.POCKETBASE_URL = "http://localhost:8090";
		process.env.POCKETBASE_GROUP = "testGroup";
		delete process.env.AUTH_MODE;
		delete process.env.UPSTREAM_URL;
		delete process.env.ALLOWED_REDIRECT_DOMAINS;
		delete process.env.PUBLIC_URL;

		app = createApp();
	});

	describe("GET / (home page)", () => {
		it("should render login page when no auth cookie is present", async () => {
			const response = await request(app).get("/").expect(401);

			expect(response.text).toContain("Bitte einloggen");
		});
	});

	describe("POST /api/cookie", () => {
		it("should set auth cookie when valid token is provided", async () => {
			const response = await request(app)
				.post("/api/cookie")
				.send({ token: "valid-token" })
				.expect(200);

			expect(response.headers["set-cookie"]).toBeDefined();
		});

		it("should return 400 when no token is provided", async () => {
			await request(app).post("/api/cookie").send({}).expect(400);
		});
	});

	describe("POST /api/logout", () => {
		it("should clear auth cookie and redirect to home page", async () => {
			const response = await request(app).post("/api/logout").expect(302);

			// Check that cookie is cleared
			expect(response.headers["set-cookie"]).toBeDefined();
			const cookieHeader = response.headers["set-cookie"][0];
			expect(cookieHeader).toContain("pb_auth=;");
			expect(cookieHeader).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
			expect(cookieHeader).toContain("Path=/");
			expect(cookieHeader).toContain("HttpOnly");
			expect(cookieHeader).toContain("SameSite=None");
			expect(cookieHeader).toContain("Secure");

			// Check redirect location
			expect(response.headers.location).toBe("/");
		});

		it("should work regardless of whether user has existing cookies", async () => {
			const response = await request(app)
				.post("/api/logout")
				.set("Cookie", "pb_auth=some-existing-token")
				.expect(302);

			expect(response.headers["set-cookie"]).toBeDefined();
			expect(response.headers.location).toBe("/");
		});
	});

	describe("GET /auth/verify (ForwardAuth)", () => {
		it("should return 401 when no auth cookie is present", async () => {
			const response = await request(app).get("/auth/verify").expect(401);

			expect(response.text).toBe("Unauthorized");
		});

		it("should return 401 when auth cookie is invalid", async () => {
			mockAuthStoreIsValid = false;

			const response = await request(app)
				.get("/auth/verify")
				.set("Cookie", "pb_auth=invalid-token")
				.expect(401);

			expect(response.text).toBe("Unauthorized");
		});

		it("should return 200 with X-Auth headers when authenticated and authorized", async () => {
			mockAuthStoreIsValid = true;

			const response = await request(app)
				.get("/auth/verify")
				.set("Cookie", "pb_auth=valid-token")
				.expect(200);

			expect(response.text).toBe("OK");
			expect(response.headers["x-auth-user"]).toBe("user-id");
			expect(response.headers["x-auth-email"]).toBe("test@example.com");
			expect(response.headers["x-auth-groups"]).toBe("testGroup");
		});
	});

	describe("GET /login", () => {
		it("should render login page", async () => {
			const response = await request(app).get("/login").expect(200);

			expect(response.text).toContain("Bitte einloggen");
		});

		it("should accept rd (redirect) query parameter", async () => {
			process.env.ALLOWED_REDIRECT_DOMAINS = "fava.example.com";
			app = createApp();

			const response = await request(app)
				.get("/login?rd=https://fava.example.com/income")
				.expect(200);

			expect(response.text).toContain("Bitte einloggen");
			expect(response.text).toContain("auth_redirect");
		});

		it("should ignore invalid redirect URLs", async () => {
			process.env.ALLOWED_REDIRECT_DOMAINS = "fava.example.com";
			app = createApp();

			const response = await request(app)
				.get("/login?rd=https://evil.com/phishing")
				.expect(200);

			expect(response.text).toContain("Bitte einloggen");
			// Should not contain the evil redirect
			expect(response.text).not.toContain("evil.com");
		});
	});
});

describe("Proxy mode", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockAuthStoreIsValid = false;
	});

	it("should throw error when UPSTREAM_URL is not set in proxy mode", () => {
		process.env.POCKETBASE_URL = "http://localhost:8090";
		process.env.POCKETBASE_GROUP = "testGroup";
		process.env.AUTH_MODE = "proxy";
		delete process.env.UPSTREAM_URL;

		expect(() => createApp()).toThrow(
			"UPSTREAM_URL environment variable is required when AUTH_MODE=proxy",
		);
	});

	it("should create app successfully when UPSTREAM_URL is set in proxy mode", () => {
		process.env.POCKETBASE_URL = "http://localhost:8090";
		process.env.POCKETBASE_GROUP = "testGroup";
		process.env.AUTH_MODE = "proxy";
		process.env.UPSTREAM_URL = "http://fava:5000";

		expect(() => createApp()).not.toThrow();
	});
});
