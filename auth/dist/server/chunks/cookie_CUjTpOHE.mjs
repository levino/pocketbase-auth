import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as authConfig } from "./authConfig_BbKSWE3X.mjs";
import PocketBase from "pocketbase";
//#region src/pages/cookie.ts
var cookie_exports = /* @__PURE__ */ __exportAll({ POST: () => POST });
var POST = async (context) => {
	try {
		const { token } = await context.request.json();
		if (!token) return new Response("Missing token", { status: 400 });
		const pb = new PocketBase(authConfig.pocketbaseUrl);
		pb.authStore.save(token, null);
		const cookie = pb.authStore.exportToCookie({
			sameSite: "Lax",
			secure: true
		});
		return new Response("OK", {
			status: 200,
			headers: { "Set-Cookie": cookie }
		});
	} catch (error) {
		console.error("[auth/cookie] Failed to set cookie:", error);
		return new Response("Invalid request", { status: 400 });
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/cookie@_@ts
var page = () => cookie_exports;
//#endregion
export { page };
