import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { S as createAstro, d as maybeRenderHead, i as renderComponent, p as addAttribute, u as renderTemplate } from "./server_CxlYmDFA.mjs";
import { t as createComponent } from "./compiler_DBb1o68O.mjs";
import { t as $$Layout } from "./Layout_Cs5Fufk3.mjs";
import { t as authConfig } from "./authConfig_BbKSWE3X.mjs";
//#region src/pages/access-denied.astro
var access_denied_exports = /* @__PURE__ */ __exportAll({
	default: () => $$AccessDenied,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://astro.build");
var $$AccessDenied = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$AccessDenied;
	const userEmail = Astro.locals.user?.email || "Unknown";
	const subject = `Access request for group "${authConfig.pocketbaseGroup}"`;
	const body = `Hi,

my name is [YOUR NAME HERE].

I'd like to request access to the "${authConfig.pocketbaseGroup}" group.

App: ${Astro.url.origin}
PocketBase: ${authConfig.pocketbaseUrl}
My account email: ${userEmail}

Thanks!`;
	const mailto = `mailto:${authConfig.adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
	Astro.response.status = 403;
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Access Denied" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="flex flex-col items-center gap-4 w-full max-w-sm px-4"><div class="card bg-base-100 shadow-xl w-full"><div class="card-body items-center text-center gap-4"><div class="bg-error/10 rounded-full p-4"><svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg></div><div><h1 class="text-2xl font-bold">Access Denied</h1><p class="text-base-content/50 mt-1 text-sm">You don't have permission to view this page.</p></div><div class="divider my-0"></div><div class="text-sm text-base-content/60"><p>Signed in as <span class="badge badge-ghost font-mono text-xs">${userEmail}</span></p><p class="mt-1">Contact the administrator to request access.</p></div><a${addAttribute(mailto, "href")} class="btn btn-primary btn-block mt-2">Request access via email</a><form action="/auth/logout" method="POST" class="w-full"><button type="submit" class="btn btn-error btn-outline btn-block">Sign out</button></form></div></div></div>` })}`;
}, "/home/runner/work/pocketbase-auth/pocketbase-auth/docker/src/pages/access-denied.astro", void 0);
var $$file = "/home/runner/work/pocketbase-auth/pocketbase-auth/docker/src/pages/access-denied.astro";
var $$url = "/auth/access-denied";
//#endregion
//#region \0virtual:astro:page:src/pages/access-denied@_@astro
var page = () => access_denied_exports;
//#endregion
export { page };
