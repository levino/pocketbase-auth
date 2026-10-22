import type { Express } from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "./index.js"

// Mock environment variables
vi.mock("dotenv", () => ({
	default: {
		config: () => {},
	},
}))

// Mock PocketBase
const mockAuthStore = {
	loadFromCookie: vi.fn(),
	clear: vi.fn(),
	exportToCookie: vi.fn(() => "pb_auth=mock-cookie; Path=/; HttpOnly"),
	save: vi.fn(),
	token: "mock-token",
	record: { id: "user-id", email: "test@example.com" },
}

const mockCollection = vi.fn(() => ({
	authRefresh: vi.fn(),
	authLogout: vi.fn(),
	authWithOAuth2: vi.fn(),
	getFirstListItem: vi.fn(() => ({ testGroup: true })),
}))

vi.mock("pocketbase", () => {
	return {
		default: vi.fn(() => ({
			authStore: mockAuthStore,
			collection: mockCollection,
		})),
	}
})

// Mock hbs
vi.mock("hbs", () => ({
	default: {
		__express: vi.fn((_path, _options, callback) => {
			// Mock template rendering
			callback(null, "<html><body>Bitte einloggen</body></html>")
		}),
	},
}))

describe("App functionality", () => {
	let app: Express

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks()

		// Set up environment variables
		process.env.POCKETBASE_URL = "http://localhost:8090"
		process.env.POCKETBASE_GROUP = "testGroup"

		app = createApp()
	})

	describe("GET / (home page)", () => {
		it("should render login page when no auth cookie is present", async () => {
			const response = await request(app).get("/").expect(401)

			expect(response.text).toContain("Bitte einloggen")
		})
	})

	describe("POST /api/cookie", () => {
		it("should set auth cookie when valid token is provided", async () => {
			const response = await request(app)
				.post("/api/cookie")
				.send({ token: "valid-token" })
				.expect(200)

			expect(response.headers["set-cookie"]).toBeDefined()
		})

		it("should return 400 when no token is provided", async () => {
			await request(app).post("/api/cookie").send({}).expect(400)
		})
	})

	describe("POST /api/logout", () => {
		it("should clear auth cookie and redirect to home page", async () => {
			const response = await request(app).post("/api/logout").expect(302)

			// Check that cookie is cleared
			expect(response.headers["set-cookie"]).toBeDefined()
			const cookieHeader = response.headers["set-cookie"][0]
			expect(cookieHeader).toContain("pb_auth=;")
			expect(cookieHeader).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT")
			expect(cookieHeader).toContain("Path=/")
			expect(cookieHeader).toContain("HttpOnly")
			expect(cookieHeader).toContain("SameSite=None")
			expect(cookieHeader).toContain("Secure")

			// Check redirect location
			expect(response.headers.location).toBe("/")
		})

		it("should work regardless of whether user has existing cookies", async () => {
			const response = await request(app)
				.post("/api/logout")
				.set("Cookie", "pb_auth=some-existing-token")
				.expect(302)

			expect(response.headers["set-cookie"]).toBeDefined()
			expect(response.headers.location).toBe("/")
		})
	})
})
