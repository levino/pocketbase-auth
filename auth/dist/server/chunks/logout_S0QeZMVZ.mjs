import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
//#region src/pages/logout.ts
var logout_exports = /* @__PURE__ */ __exportAll({ POST: () => POST });
var POST = () => new Response(null, {
	status: 302,
	headers: {
		Location: "/",
		"Set-Cookie": "pb_auth=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0"
	}
});
//#endregion
//#region \0virtual:astro:page:src/pages/logout@_@ts
var page = () => logout_exports;
//#endregion
export { page };
