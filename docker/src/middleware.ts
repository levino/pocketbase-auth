import PocketBase from "pocketbase";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
	if (context.url.pathname.startsWith("/auth/")) {
		return next();
	}

	const cookie = context.request.headers.get("cookie") || "";
	const pb = new PocketBase(process.env.POCKETBASE_URL);
	pb.authStore.loadFromCookie(cookie);

	if (!pb.authStore.isValid) {
		return context.redirect("/auth/login");
	}

	try {
		await pb.collection("users").authRefresh();
	} catch {
		return context.redirect("/auth/login");
	}

	const user = pb.authStore.record;
	if (!user) {
		return context.redirect("/auth/login");
	}

	if (process.env.POCKETBASE_GROUP) {
		try {
			const groups = await pb
				.collection("groups")
				.getFirstListItem(`user_id="${user.id}"`);
			if (!groups[process.env.POCKETBASE_GROUP]) {
				return context.redirect("/auth/access-denied");
			}
		} catch {
			return context.redirect("/auth/access-denied");
		}
	}

	context.locals.user = user;
	return next();
});
