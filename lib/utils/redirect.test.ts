import { describe, expect, it } from "vitest";
import { getSafeRedirectUrl, isAllowedRedirect } from "./redirect.ts";

describe("isAllowedRedirect", () => {
	it("should return false for empty URL", () => {
		expect(isAllowedRedirect("", "example.com")).toBe(false);
	});

	it("should return false for invalid URL", () => {
		expect(isAllowedRedirect("not-a-url", "example.com")).toBe(false);
	});

	it("should return false for non-http protocols", () => {
		expect(isAllowedRedirect("javascript:alert(1)", "example.com")).toBe(false);
		expect(isAllowedRedirect("file:///etc/passwd", "example.com")).toBe(false);
		expect(isAllowedRedirect("ftp://example.com", "example.com")).toBe(false);
	});

	it("should return true for exact domain match", () => {
		expect(isAllowedRedirect("https://fava.example.com/", "fava.example.com")).toBe(true);
		expect(isAllowedRedirect("http://fava.example.com/path", "fava.example.com")).toBe(true);
	});

	it("should return true for subdomain match", () => {
		expect(isAllowedRedirect("https://sub.example.com/", "example.com")).toBe(true);
		expect(isAllowedRedirect("https://deep.sub.example.com/path", "example.com")).toBe(true);
	});

	it("should return false for non-matching domain", () => {
		expect(isAllowedRedirect("https://evil.com/", "example.com")).toBe(false);
		expect(isAllowedRedirect("https://example.com.evil.com/", "example.com")).toBe(false);
	});

	it("should handle multiple allowed domains", () => {
		const domains = "fava.example.com, grafana.example.com, example.org";
		expect(isAllowedRedirect("https://fava.example.com/", domains)).toBe(true);
		expect(isAllowedRedirect("https://grafana.example.com/", domains)).toBe(true);
		expect(isAllowedRedirect("https://example.org/", domains)).toBe(true);
		expect(isAllowedRedirect("https://evil.com/", domains)).toBe(false);
	});

	it("should be case insensitive for domains", () => {
		expect(isAllowedRedirect("https://EXAMPLE.COM/", "example.com")).toBe(true);
		expect(isAllowedRedirect("https://example.com/", "EXAMPLE.COM")).toBe(true);
	});

	it("should return true for same-origin when publicUrl matches", () => {
		expect(
			isAllowedRedirect("https://auth.example.com/callback", undefined, "https://auth.example.com"),
		).toBe(true);
	});

	it("should return false when no domains configured and publicUrl does not match", () => {
		expect(isAllowedRedirect("https://other.com/", undefined, "https://auth.example.com")).toBe(
			false,
		);
	});

	it("should return false when no configuration provided", () => {
		expect(isAllowedRedirect("https://example.com/")).toBe(false);
	});
});

describe("getSafeRedirectUrl", () => {
	it("should return default for null/undefined URL", () => {
		expect(getSafeRedirectUrl(null, "example.com")).toBe("/");
		expect(getSafeRedirectUrl(undefined, "example.com")).toBe("/");
	});

	it("should return validated URL for allowed domain", () => {
		expect(getSafeRedirectUrl("https://fava.example.com/income", "fava.example.com")).toBe(
			"https://fava.example.com/income",
		);
	});

	it("should return default for disallowed domain", () => {
		expect(getSafeRedirectUrl("https://evil.com/", "example.com")).toBe("/");
	});

	it("should use custom default URL", () => {
		expect(getSafeRedirectUrl("https://evil.com/", "example.com", undefined, "/home")).toBe("/home");
	});
});
