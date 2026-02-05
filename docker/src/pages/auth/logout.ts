import type { APIRoute } from "astro";

const logout = () =>
	new Response(null, {
		status: 302,
		headers: {
			Location: "/",
			"Set-Cookie": "pb_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
		},
	});

export const GET: APIRoute = logout;
export const POST: APIRoute = logout;
