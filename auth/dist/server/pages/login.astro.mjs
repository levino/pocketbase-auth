import { e as createComponent, k as renderComponent, l as renderScript, r as renderTemplate, h as createAstro, m as maybeRenderHead, n as renderSlot } from '../chunks/astro/server_D8noONNE.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DhkLW7bg.mjs';
import { a as authConfig } from '../chunks/authConfig_CXXmMRGo.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro$4 = createAstro();
const $$OAuthLoginButton = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$OAuthLoginButton;
  const { provider, label, pocketbaseUrl } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "oauth-login-button", "oauth-login-button", { "data-provider": provider, "data-pocketbase-url": pocketbaseUrl }, { "default": () => renderTemplate` ${maybeRenderHead()}<button class="btn btn-outline btn-block gap-3 justify-start font-medium"> ${renderSlot($$result, $$slots["default"])} ${label} </button> ` })} ${renderScript($$result, "/home/runner/work/pocketbase-auth/pocketbase-auth/docker/src/components/OAuthLoginButton.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/runner/work/pocketbase-auth/pocketbase-auth/docker/src/components/OAuthLoginButton.astro", void 0);

const $$Astro$3 = createAstro();
const $$GithubLoginButton = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$GithubLoginButton;
  const { pocketbaseUrl } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "OAuthLoginButton", $$OAuthLoginButton, { "provider": "github", "label": "Continue with GitHub", "pocketbaseUrl": pocketbaseUrl }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"> <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"></path> </svg> ` })}`;
}, "/home/runner/work/pocketbase-auth/pocketbase-auth/docker/src/components/GithubLoginButton.astro", void 0);

const $$Astro$2 = createAstro();
const $$GoogleLoginButton = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$GoogleLoginButton;
  const { pocketbaseUrl } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "OAuthLoginButton", $$OAuthLoginButton, { "provider": "google", "label": "Continue with Google", "pocketbaseUrl": pocketbaseUrl }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<svg class="w-5 h-5" viewBox="0 0 24 24"> <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"></path> <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path> <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path> <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path> </svg> ` })}`;
}, "/home/runner/work/pocketbase-auth/pocketbase-auth/docker/src/components/GoogleLoginButton.astro", void 0);

const $$Astro$1 = createAstro();
const $$MicrosoftLoginButton = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$MicrosoftLoginButton;
  const { pocketbaseUrl } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "OAuthLoginButton", $$OAuthLoginButton, { "provider": "microsoft", "label": "Continue with Microsoft", "pocketbaseUrl": pocketbaseUrl }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<svg class="w-5 h-5" viewBox="0 0 24 24"> <rect x="1" y="1" width="10" height="10" fill="#F25022"></rect> <rect x="13" y="1" width="10" height="10" fill="#7FBA00"></rect> <rect x="1" y="13" width="10" height="10" fill="#00A4EF"></rect> <rect x="13" y="13" width="10" height="10" fill="#FFB900"></rect> </svg> ` })}`;
}, "/home/runner/work/pocketbase-auth/pocketbase-auth/docker/src/components/MicrosoftLoginButton.astro", void 0);

const $$Astro = createAstro();
const $$Login = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Login;
  Astro2.response.status = 401;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Sign in" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-col items-center gap-4 w-full max-w-sm px-4"> ${renderTemplate`<div role="alert" class="alert alert-warning text-sm"> <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path> </svg> <span>Change <code class="badge badge-ghost badge-sm font-mono">pocketbaseGroup</code> in <code class="badge badge-ghost badge-sm font-mono">authConfig.ts</code> before deploying.</span> </div>`} <div class="card bg-base-100 shadow-xl w-full"> <div class="card-body gap-6"> <div class="text-center"> <h1 class="text-2xl font-bold">Sign in</h1> <p class="text-base-content/50 mt-1 text-sm">Choose a provider to continue</p> </div> <div class="flex flex-col gap-3"> ${renderComponent($$result2, "GithubLoginButton", $$GithubLoginButton, { "pocketbaseUrl": authConfig.pocketbaseUrl })} ${renderComponent($$result2, "GoogleLoginButton", $$GoogleLoginButton, { "pocketbaseUrl": authConfig.pocketbaseUrl })} ${renderComponent($$result2, "MicrosoftLoginButton", $$MicrosoftLoginButton, { "pocketbaseUrl": authConfig.pocketbaseUrl })} </div> </div> </div> <p class="text-base-content/40 text-xs text-center">
Secured by PocketBase
</p> </div> ` })}`;
}, "/home/runner/work/pocketbase-auth/pocketbase-auth/docker/src/pages/login.astro", void 0);

const $$file = "/home/runner/work/pocketbase-auth/pocketbase-auth/docker/src/pages/login.astro";
const $$url = "/auth/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Login,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
