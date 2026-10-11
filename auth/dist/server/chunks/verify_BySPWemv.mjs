import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as authConfig } from "./authConfig_BbKSWE3X.mjs";
import PocketBase from "pocketbase";
//#region src/pages/verify.ts
var verify_exports = /* @__PURE__ */ __exportAll({ GET: () => GET });
var GET = async (context) => {
	const cookie = context.request.headers.get("cookie") || "";
	const pb = new PocketBase(authConfig.pocketbaseUrl);
	pb.authStore.loadFromCookie(cookie);
	if (!pb.authStore.isValid) return context.rewrite("/auth/login");
	try {
		await pb.collection("users").authRefresh();
	} catch {
		return context.rewrite("/auth/login");
	}
	const user = pb.authStore.record;
	if (!user) return context.rewrite("/auth/login");
	try {
		if (!(await pb.collection("groups").getFirstListItem(`user_id="${user.id}"`))[authConfig.pocketbaseGroup]) return context.rewrite("/auth/access-denied");
	} catch {
		return context.rewrite("/auth/access-denied");
	}
	return new Response("OK", {
		status: 200,
		headers: {
			"X-Auth-User": String(user.id ?? ""),
			"X-Auth-Email": String(user.email ?? "")
		}
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/verify@_@ts
var page = () => verify_exports;
//#endregion
export { page };
