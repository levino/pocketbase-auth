import { e as createComponent, o as renderHead, n as renderSlot, r as renderTemplate, h as createAstro } from './astro/server_D8noONNE.mjs';
import 'piccolore';
import 'clsx';
/* empty css                                 */

const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>${renderHead()}</head> <body class="min-h-screen flex items-center justify-center bg-base-200"> ${renderSlot($$result, $$slots["default"])} </body></html>`;
}, "/home/runner/work/pocketbase-auth/pocketbase-auth/docker/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
