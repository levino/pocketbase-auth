/**
 * Redirect URL validation utilities
 *
 * Prevents open redirect vulnerabilities by validating redirect URLs
 * against a whitelist of allowed domains.
 */

/**
 * Check if a redirect URL is allowed based on configuration
 *
 * @param url - The URL to validate
 * @param allowedDomains - Comma-separated list of allowed domains (from ALLOWED_REDIRECT_DOMAINS)
 * @param publicUrl - The public URL of this service (from PUBLIC_URL)
 * @returns true if the redirect is allowed, false otherwise
 */
export function isAllowedRedirect(
	url: string,
	allowedDomains?: string,
	publicUrl?: string,
): boolean {
	if (!url) {
		return false;
	}

	try {
		const parsed = new URL(url);

		// Only allow http and https protocols
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return false;
		}

		// Allow same-origin redirects if PUBLIC_URL is set
		if (publicUrl) {
			try {
				const publicParsed = new URL(publicUrl);
				if (parsed.hostname === publicParsed.hostname) {
					return true;
				}
			} catch {
				// Invalid PUBLIC_URL, continue with domain check
			}
		}

		// Check against whitelist of allowed domains
		if (allowedDomains) {
			const domains = allowedDomains
				.split(",")
				.map((d) => d.trim().toLowerCase())
				.filter(Boolean);

			const hostname = parsed.hostname.toLowerCase();

			return domains.some((domain) => {
				// Exact match
				if (hostname === domain) {
					return true;
				}
				// Subdomain match (e.g., "example.com" allows "sub.example.com")
				if (hostname.endsWith(`.${domain}`)) {
					return true;
				}
				return false;
			});
		}

		return false;
	} catch {
		// Invalid URL
		return false;
	}
}

/**
 * Sanitize and validate a redirect URL, returning a safe default if invalid
 *
 * @param url - The URL to validate
 * @param allowedDomains - Comma-separated list of allowed domains
 * @param publicUrl - The public URL of this service
 * @param defaultUrl - Default URL to return if validation fails (default: "/")
 * @returns The validated URL or the default
 */
export function getSafeRedirectUrl(
	url: string | undefined | null,
	allowedDomains?: string,
	publicUrl?: string,
	defaultUrl = "/",
): string {
	if (!url) {
		return defaultUrl;
	}

	if (isAllowedRedirect(url, allowedDomains, publicUrl)) {
		return url;
	}

	return defaultUrl;
}
