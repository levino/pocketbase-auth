import type { APIRoute } from "astro";
import PocketBase from "pocketbase";

export const POST: APIRoute = async ({ request }) => {
	try {
		const { token } = await request.json();
		if (!token) {
			return new Response("Missing token", { status: 400 });
		}

		const pb = new PocketBase(process.env.POCKETBASE_URL);
		pb.authStore.save(token, null);
		const cookie = pb.authStore.exportToCookie({ sameSite: "Lax" });

		return new Response("OK", {
			status: 200,
			headers: { "Set-Cookie": cookie },
		});
	} catch (error) {
		console.error("[auth/cookie] Failed to set cookie:", error);
		return new Response("Invalid request", { status: 400 });
	}
};
