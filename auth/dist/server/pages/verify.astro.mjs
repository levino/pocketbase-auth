import PocketBase from 'pocketbase';
import { a as authConfig } from '../chunks/authConfig_CXXmMRGo.mjs';
export { renderers } from '../renderers.mjs';

const GET = async (context) => {
  const cookie = context.request.headers.get("cookie") || "";
  const pb = new PocketBase(authConfig.pocketbaseUrl);
  pb.authStore.loadFromCookie(cookie);
  if (!pb.authStore.isValid) {
    return context.rewrite("/auth/login");
  }
  try {
    await pb.collection("users").authRefresh();
  } catch {
    return context.rewrite("/auth/login");
  }
  const user = pb.authStore.record;
  if (!user) {
    return context.rewrite("/auth/login");
  }
  try {
    const groups = await pb.collection("groups").getFirstListItem(`user_id="${user.id}"`);
    if (!groups[authConfig.pocketbaseGroup]) {
      return context.rewrite("/auth/access-denied");
    }
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

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
