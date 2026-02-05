import type { APIRoute } from "astro";
import PocketBase from "pocketbase";
import authConfig from "../../authConfig";

export const GET: APIRoute = async ({ request }) => {
	const cookie = request.headers.get("cookie") || "";
	const pb = new PocketBase(authConfig.pocketbaseUrl);
	pb.authStore.loadFromCookie(cookie);

	if (!pb.authStore.isValid) {
		return new Response(null, { status: 401 });
	}

	try {
		await pb.collection("users").authRefresh();
	} catch {
		return new Response(null, { status: 401 });
	}

	const user = pb.authStore.record;
	if (!user) {
		return new Response(null, { status: 401 });
	}

	try {
		const groups = await pb
			.collection("groups")
			.getFirstListItem(`user_id="${user.id}"`);
		if (!groups[authConfig.pocketbaseGroup]) {
			return new Response(null, { status: 403 });
		}
	} catch {
		return new Response(null, { status: 403 });
	}

	return new Response("OK", {
		status: 200,
		headers: {
			"X-Auth-User": String(user.id ?? ""),
			"X-Auth-Email": String(user.email ?? ""),
		},
	});
};
