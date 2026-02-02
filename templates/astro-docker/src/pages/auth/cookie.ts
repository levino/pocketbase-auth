import type { APIRoute } from "astro";
import PocketBase from "pocketbase";

const POCKETBASE_URL = import.meta.env.POCKETBASE_URL;

/**
 * Convert OAuth token to HTTP-only cookie
 */
export const POST: APIRoute = async ({ request }) => {
	const { token } = await request.json();

	if (!token) {
		return new Response("Missing token", { status: 400 });
	}

	const pb = new PocketBase(POCKETBASE_URL);
	pb.authStore.save(token, null);
	const cookie = pb.authStore.exportToCookie({ sameSite: "Lax", secure: true });

	return new Response("OK", {
		status: 200,
		headers: { "Set-Cookie": cookie },
	});
};
