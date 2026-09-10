import { S as createAstro, f as renderHead, s as renderSlot, u as renderTemplate } from "./server_CxlYmDFA.mjs";
import { t as createComponent } from "./compiler_DBb1o68O.mjs";
//#region src/layouts/Layout.astro
createAstro("https://astro.build");
var $$Layout = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Layout;
	const { title } = Astro.props;
	return renderTemplate`<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>${renderHead($$result)}</head><body class="min-h-screen flex items-center justify-center bg-base-200">${renderSlot($$result, $$slots["default"])}</body></html>`;
}, "/home/runner/work/pocketbase-auth/pocketbase-auth/docker/src/layouts/Layout.astro", void 0);
//#endregion
export { $$Layout as t };
