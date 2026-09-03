import PocketBase from 'pocketbase';
import { a as authConfig } from '../chunks/authConfig_CXXmMRGo.mjs';
export { renderers } from '../renderers.mjs';

const POST = async (context) => {
  try {
    const { token } = await context.request.json();
    if (!token) {
      return new Response("Missing token", { status: 400 });
    }
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

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
