import type { APIRoute } from "astro";
import PocketBase from "pocketbase";
import authConfig from "../../authConfig";

const loginPage = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Login</title>
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body { font-family: system-ui, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f5f5; }
		.container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
		h1 { margin-bottom: 1rem; }
		p { color: #666; margin-bottom: 1.5rem; }
		.buttons { display: flex; flex-direction: column; gap: 0.75rem; }
		button { padding: 0.75rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; transition: opacity 0.2s; }
		button:hover { opacity: 0.9; }
		.github { background: #24292e; color: white; }
		.google { background: #4285f4; color: white; }
		.microsoft { background: #00a4ef; color: white; }
	</style>
</head>
<body>
	<div class="container">
		<h1>Login</h1>
		<p>Please sign in to continue.</p>
		<div class="buttons">
			<button class="github" id="loginGithub">Continue with GitHub</button>
			<button class="google" id="loginGoogle">Continue with Google</button>
			<button class="microsoft" id="loginMicrosoft">Continue with Microsoft</button>
		</div>
	</div>
	<script type="module">
		import PocketBase from "https://cdn.jsdelivr.net/npm/pocketbase@0.26.0/dist/pocketbase.es.mjs";
		const pb = new PocketBase("${authConfig.pocketbaseUrl}");
		async function login(provider) {
			try {
				await pb.collection("users").authWithOAuth2({ provider });
				await fetch("/auth/cookie", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ token: pb.authStore.token }),
				});
				window.location.reload();
			} catch (err) {
				console.error("Login failed:", err);
			}
		}
		document.getElementById("loginGithub").onclick = () => login("github");
		document.getElementById("loginGoogle").onclick = () => login("google");
		document.getElementById("loginMicrosoft").onclick = () => login("microsoft");
	</script>
</body>
</html>`;

const accessDeniedPage = (opts: { userEmail: string; appUrl: string }) => {
	const subject = encodeURIComponent(
		`Access request for group "${authConfig.pocketbaseGroup}"`,
	);
	const body = encodeURIComponent(
		`Hi,

my name is [YOUR NAME HERE].

I'd like to request access to the "${authConfig.pocketbaseGroup}" group.

App: ${opts.appUrl}
PocketBase: ${authConfig.pocketbaseUrl}
My account email: ${opts.userEmail}

Thanks!`,
	);
	const mailto = `mailto:${authConfig.adminEmail}?subject=${subject}&body=${body}`;

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Access Denied</title>
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body { font-family: system-ui, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f5f5; }
		.container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 450px; width: 100%; text-align: center; }
		h1 { margin-bottom: 1rem; color: #e74c3c; }
		p { color: #666; margin-bottom: 0.5rem; }
		.actions { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem; }
		a.request-btn { display: block; padding: 0.75rem 1.5rem; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; text-decoration: none; transition: opacity 0.2s; }
		a.request-btn:hover { opacity: 0.9; }
		button { padding: 0.75rem 1.5rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; transition: opacity 0.2s; }
		button:hover { opacity: 0.9; }
	</style>
</head>
<body>
	<div class="container">
		<h1>Access Denied</h1>
		<p>You don't have permission to view this page.</p>
		<p>Contact the administrator to request access.</p>
		<div class="actions">
			<a class="request-btn" href="${mailto}">Request access via email</a>
			<form action="/auth/logout" method="POST">
				<button type="submit">Sign out</button>
			</form>
		</div>
	</div>
</body>
</html>`;
};

const authenticatedResponse = (user: Record<string, unknown> | null) =>
	new Response("OK", {
		status: 200,
		headers: {
			"X-Auth-User": String(user?.id ?? ""),
			"X-Auth-Email": String(user?.email ?? ""),
		},
	});

export const GET: APIRoute = async ({ request }) => {
	const forwardedHost = request.headers.get("x-forwarded-host") || "";
	const forwardedProto = request.headers.get("x-forwarded-proto") || "http";
	const appUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : "";
	const cookie = request.headers.get("cookie") || "";
	const pb = new PocketBase(authConfig.pocketbaseUrl);
	pb.authStore.loadFromCookie(cookie);

	if (!pb.authStore.isValid) {
		return new Response(loginPage, {
			status: 401,
			headers: { "Content-Type": "text/html" },
		});
	}

	try {
		await pb.collection("users").authRefresh();
	} catch {
		return new Response(loginPage, {
			status: 401,
			headers: { "Content-Type": "text/html" },
		});
	}

	const user = pb.authStore.record;
	if (!user) {
		return new Response(loginPage, {
			status: 401,
			headers: { "Content-Type": "text/html" },
		});
	}

	try {
		const groups = await pb
			.collection("groups")
			.getFirstListItem(`user_id="${user.id}"`);
		if (!groups[authConfig.pocketbaseGroup]) {
			return new Response(
				accessDeniedPage({ userEmail: String(user.email ?? ""), appUrl }),
				{ status: 403, headers: { "Content-Type": "text/html" } },
			);
		}
	} catch {
		return new Response(
			accessDeniedPage({ userEmail: String(user.email ?? ""), appUrl }),
			{ status: 403, headers: { "Content-Type": "text/html" } },
		);
	}

	return authenticatedResponse(user);
};
