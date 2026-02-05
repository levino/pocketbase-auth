import PocketBase from "pocketbase"
import { defineMiddleware } from "astro:middleware"
import authConfig from "./authConfig"

export const onRequest = defineMiddleware(async (context, next) => {
	if (context.url.pathname.startsWith("/auth/")) {
		return next()
	}

	const cookie = context.request.headers.get("cookie")
	if (!cookie) {
		return context.redirect("/auth/login")
	}

	const pb = new PocketBase(authConfig.pocketbaseUrl)
	pb.authStore.loadFromCookie(cookie)

	try {
		await pb.collection("users").authRefresh()
	} catch {
		return context.redirect("/auth/login")
	}

	const user = pb.authStore.record
	if (!user) {
		return context.redirect("/auth/login")
	}

	try {
		const groups = await pb
			.collection("groups")
			.getFirstListItem(`user_id="${user.id}"`)
		if (!groups[authConfig.pocketbaseGroup]) {
			return context.redirect("/auth/access-denied")
		}
	} catch {
		return context.redirect("/auth/access-denied")
	}

	context.locals.user = user
	return next()
})
