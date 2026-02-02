import type { APIRoute } from "astro";

/**
 * Clear auth cookie and redirect to login
 */
export const POST: APIRoute = async () => {
	return new Response(null, {
		status: 302,
		headers: {
			Location: "/login",
			"Set-Cookie": "pb_auth=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0",
		},
	});
};
