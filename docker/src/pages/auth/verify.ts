import type { APIRoute } from "astro";
import PocketBase from "pocketbase";
import authConfig from "../../authConfig";

export const GET: APIRoute = async ({ request }) => {
	const cookie = request.headers.get("cookie") || "";
	console.log("[auth/verify] Cookie present:", cookie ? "yes" : "no");
	console.log("[auth/verify] Cookie value:", cookie.slice(0, 80) || "(empty)");

	const pb = new PocketBase(authConfig.pocketbaseUrl);
	pb.authStore.loadFromCookie(cookie);
	console.log("[auth/verify] Auth valid:", pb.authStore.isValid);

	if (!pb.authStore.isValid) {
		console.log("[auth/verify] -> 401 (invalid auth store)");
		return new Response(null, { status: 401 });
	}

	try {
		await pb.collection("users").authRefresh();
	} catch (err) {
		console.log("[auth/verify] -> 401 (refresh failed):", err);
		return new Response(null, { status: 401 });
	}

	const user = pb.authStore.record;
	if (!user) {
		console.log("[auth/verify] -> 401 (no user after refresh)");
		return new Response(null, { status: 401 });
	}

	console.log("[auth/verify] User:", user.email, user.id);

	try {
		const groups = await pb
			.collection("groups")
			.getFirstListItem(`user_id="${user.id}"`);
		if (!groups[authConfig.pocketbaseGroup]) {
			console.log("[auth/verify] -> 403 (not in group", authConfig.pocketbaseGroup, ")");
			return new Response(null, { status: 403 });
		}
	} catch (err) {
		console.log("[auth/verify] -> 403 (group lookup failed):", err);
		return new Response(null, { status: 403 });
	}

	console.log("[auth/verify] -> 200 OK");
	return new Response("OK", {
		status: 200,
		headers: {
			"X-Auth-User": String(user.id ?? ""),
			"X-Auth-Email": String(user.email ?? ""),
		},
	});
};
