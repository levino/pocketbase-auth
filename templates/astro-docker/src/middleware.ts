import PocketBase from "pocketbase";
import { defineMiddleware } from "astro:middleware";

const POCKETBASE_URL = import.meta.env.POCKETBASE_URL;
const POCKETBASE_GROUP = import.meta.env.POCKETBASE_GROUP;

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;

	// Public routes - no auth required
	if (
		pathname === "/login" ||
		pathname === "/access-denied" ||
		pathname.startsWith("/auth/") ||
		pathname.startsWith("/_")
	) {
		return next();
	}

	// Get auth cookie
	const cookie = context.request.headers.get("cookie") || "";
	const pb = new PocketBase(POCKETBASE_URL);
	pb.authStore.loadFromCookie(cookie);

	// Check authentication
	if (!pb.authStore.isValid) {
		return context.redirect("/login");
	}

	try {
		// Refresh token and get user
		await pb.collection("users").authRefresh();
		const user = pb.authStore.record;

		// Check group membership
		if (POCKETBASE_GROUP && user) {
			const groups = await pb.collection("groups").getFirstListItem(`user_id="${user.id}"`);
			if (!groups[POCKETBASE_GROUP]) {
				return context.redirect("/access-denied");
			}
		}

		// Store user in locals for pages to access
		context.locals.user = user;
		return next();
	} catch {
		return context.redirect("/login");
	}
});
