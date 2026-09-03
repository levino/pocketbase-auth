export { renderers } from '../renderers.mjs';

const POST = () => new Response(null, {
  status: 302,
  headers: {
    Location: "/",
    "Set-Cookie": "pb_auth=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0"
  }
});

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
