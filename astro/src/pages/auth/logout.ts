import type { APIRoute } from "astro";

export const POST: APIRoute = () =>
	new Response(null, {
		status: 302,
		headers: {
			Location: "/",
			"Set-Cookie":
				"pb_auth=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0",
		},
	});
