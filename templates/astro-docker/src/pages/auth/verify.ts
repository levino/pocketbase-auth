import type { APIRoute } from "astro";
import PocketBase from "pocketbase";

const POCKETBASE_URL = import.meta.env.POCKETBASE_URL;
const POCKETBASE_GROUP = import.meta.env.POCKETBASE_GROUP;

/**
 * ForwardAuth endpoint for Traefik/nginx/Caddy
 * Returns 200 + headers if authenticated, 401/403 otherwise
 */
export const GET: APIRoute = async ({ request }) => {
	const cookie = request.headers.get("cookie") || "";
	const pb = new PocketBase(POCKETBASE_URL);
	pb.authStore.loadFromCookie(cookie);

	if (!pb.authStore.isValid) {
		return new Response("Unauthorized", { status: 401 });
	}

	try {
		await pb.collection("users").authRefresh();
		const user = pb.authStore.record;

		if (POCKETBASE_GROUP && user) {
			const groups = await pb.collection("groups").getFirstListItem(`user_id="${user.id}"`);
			if (!groups[POCKETBASE_GROUP]) {
				return new Response("Forbidden", { status: 403 });
			}
		}

		return new Response("OK", {
			status: 200,
			headers: {
				"X-Auth-User": user?.id || "",
				"X-Auth-Email": user?.email || "",
				"X-Auth-Groups": POCKETBASE_GROUP || "",
			},
		});
	} catch {
		return new Response("Unauthorized", { status: 401 });
	}
};
