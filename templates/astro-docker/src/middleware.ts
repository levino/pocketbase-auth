import PocketBase from "pocketbase";
import { defineMiddleware } from "astro:middleware";

const POCKETBASE_URL = import.meta.env.POCKETBASE_URL;
const POCKETBASE_GROUP = import.meta.env.POCKETBASE_GROUP;

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;

	if (pathname.startsWith("/public/")) {
		return next();
	}

	const cookie = context.request.headers.get("cookie") || "";
	const pb = new PocketBase(POCKETBASE_URL);
	pb.authStore.loadFromCookie(cookie);

	if (!pb.authStore.isValid) {
		return context.redirect("/public/login");
	}

	try {
		await pb.collection("users").authRefresh();
		const user = pb.authStore.record;

		if (POCKETBASE_GROUP && user) {
			const groups = await pb.collection("groups").getFirstListItem(`user_id="${user.id}"`);
			if (!groups[POCKETBASE_GROUP]) {
				return context.redirect("/public/access-denied");
			}
		}

		return next();
	} catch {
		return context.redirect("/public/login");
	}
});
