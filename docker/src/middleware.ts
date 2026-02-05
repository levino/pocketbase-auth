import PocketBase from "pocketbase";
import { defineMiddleware } from "astro:middleware";
import authConfig from "./authConfig";

export const onRequest = defineMiddleware(async (context, next) => {
	if (context.url.pathname.startsWith("/auth/")) {
		return next();
	}

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

	context.locals.user = user;

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

	return next();
});
