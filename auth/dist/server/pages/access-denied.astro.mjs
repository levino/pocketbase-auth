import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead, g as addAttribute } from '../chunks/astro/server_D8noONNE.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DhkLW7bg.mjs';
import { a as authConfig } from '../chunks/authConfig_CXXmMRGo.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$AccessDenied = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AccessDenied;
  const userEmail = Astro2.locals.user?.email || "Unknown";
  const subject = `Access request for group "${authConfig.pocketbaseGroup}"`;
  const body = `Hi,

my name is [YOUR NAME HERE].

I'd like to request access to the "${authConfig.pocketbaseGroup}" group.

App: ${Astro2.url.origin}
PocketBase: ${authConfig.pocketbaseUrl}
My account email: ${userEmail}

Thanks!`;
  const mailto = `mailto:${authConfig.adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  Astro2.response.status = 403;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Access Denied" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-col items-center gap-4 w-full max-w-sm px-4"> <div class="card bg-base-100 shadow-xl w-full"> <div class="card-body items-center text-center gap-4"> <div class="bg-error/10 rounded-full p-4"> <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path> </svg> </div> <div> <h1 class="text-2xl font-bold">Access Denied</h1> <p class="text-base-content/50 mt-1 text-sm">You don't have permission to view this page.</p> </div> <div class="divider my-0"></div> <div class="text-sm text-base-content/60"> <p>Signed in as <span class="badge badge-ghost font-mono text-xs">${userEmail}</span></p> <p class="mt-1">Contact the administrator to request access.</p> </div> <a${addAttribute(mailto, "href")} class="btn btn-primary btn-block mt-2">Request access via email</a> <form action="/auth/logout" method="POST" class="w-full"> <button type="submit" class="btn btn-error btn-outline btn-block">Sign out</button> </form> </div> </div> </div> ` })}`;
}, "/home/runner/work/pocketbase-auth/pocketbase-auth/docker/src/pages/access-denied.astro", void 0);

const $$file = "/home/runner/work/pocketbase-auth/pocketbase-auth/docker/src/pages/access-denied.astro";
const $$url = "/auth/access-denied";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$AccessDenied,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
