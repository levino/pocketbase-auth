import type { APIRoute } from "astro";
import PocketBase from "pocketbase";

const POCKETBASE_URL = import.meta.env.POCKETBASE_URL;
const POCKETBASE_GROUP = import.meta.env.POCKETBASE_GROUP;

const unauthorizedResponse = () =>
	new Response("Unauthorized", { status: 401 });

const forbiddenResponse = () =>
	new Response("Forbidden", { status: 403 });

const authenticatedResponse = (user: Record<string, unknown> | null) =>
	new Response("OK", {
		status: 200,
		headers: {
			"X-Auth-User": String(user?.id ?? ""),
			"X-Auth-Email": String(user?.email ?? ""),
			"X-Auth-Groups": POCKETBASE_GROUP || "",
		},
	});

const verifyGroupMembership = (pocketBase: PocketBase) => {
	const user = pocketBase.authStore.record;
	if (!POCKETBASE_GROUP || !user) {
		return Promise.resolve(authenticatedResponse(user));
	}
	return pocketBase
		.collection("groups")
		.getFirstListItem(`user_id="${user.id}"`)
		.then((groups) =>
			groups[POCKETBASE_GROUP]
				? authenticatedResponse(user)
				: forbiddenResponse(),
		);
};

export const GET: APIRoute = ({ request }) => {
	const cookie = request.headers.get("cookie") || "";
	const pocketBase = new PocketBase(POCKETBASE_URL);
	pocketBase.authStore.loadFromCookie(cookie);

	if (!pocketBase.authStore.isValid) {
		return unauthorizedResponse();
	}

	return pocketBase
		.collection("users")
		.authRefresh()
		.then(() => verifyGroupMembership(pocketBase))
		.catch(unauthorizedResponse);
};
