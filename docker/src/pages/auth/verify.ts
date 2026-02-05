import type { APIRoute } from "astro";
import PocketBase from "pocketbase";
import authConfig from "../../authConfig";

export const GET: APIRoute = async (context) => {
	const cookie = context.request.headers.get("cookie") || "";
	const pb = new PocketBase(authConfig.pocketbaseUrl);
	pb.authStore.loadFromCookie(cookie);

	if (!pb.authStore.isValid) {
		return context.rewrite("/auth/login");
	}

	try {
		await pb.collection("users").authRefresh();
	} catch {
		return context.rewrite("/auth/login");
	}

	const user = pb.authStore.record;
	if (!user) {
		return context.rewrite("/auth/login");
	}

	try {
		const groups = await pb
			.collection("groups")
			.getFirstListItem(`user_id="${user.id}"`);
		if (!groups[authConfig.pocketbaseGroup]) {
			return context.rewrite("/auth/access-denied");
		}
	} catch {
		return context.rewrite("/auth/access-denied");
	}

	return new Response("OK", {
		status: 200,
		headers: {
			"X-Auth-User": String(user.id ?? ""),
			"X-Auth-Email": String(user.email ?? ""),
		},
	});
};
