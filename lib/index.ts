import PocketBase from "pocketbase";
import { getSafeRedirectUrl, isAllowedRedirect } from "./utils/redirect.ts";

// Re-export redirect utilities
export { getSafeRedirectUrl, isAllowedRedirect };

/**
 * Auth mode determines how the application handles requests
 */
export type AuthMode = "static" | "forwardauth" | "proxy";

/**
 * Configuration options for the PocketBase auth middleware
 */
export interface PocketBaseAuthOptions {
	/** URL of the PocketBase instance */
	pocketbaseUrl: string;
	/** Optional: Separate PocketBase URL for Microsoft OAuth */
	pocketbaseUrlMicrosoft?: string;
	/** Name of the group field to check for authorization */
	groupField: string;
	/** Auth mode: static (default), forwardauth, or proxy */
	authMode?: AuthMode;
	/** Comma-separated list of allowed redirect domains (for forwardauth mode) */
	allowedRedirectDomains?: string;
	/** Public URL of this auth service (for redirect validation) */
	publicUrl?: string;
	/** Upstream URL for proxy mode */
	upstreamUrl?: string;
}

/**
 * Result of authentication verification
 */
export interface AuthResult {
	isAuthenticated: boolean;
	isAuthorized: boolean;
	user?: { id: string; email: string };
	error?: string;
}

// --- Utility functions ---

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(str: string | undefined | null): string {
	if (str == null) return "";
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/**
 * Escape string for use in JavaScript string literals
 */
function escapeJs(str: string | undefined | null): string {
	if (str == null) return "";
	return str
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/'/g, "\\'")
		.replace(/\n/g, "\\n")
		.replace(/\r/g, "\\r")
		.replace(/</g, "\\x3c")
		.replace(/>/g, "\\x3e");
}

function jsonResponse(
	data: unknown,
	status = 200,
	headers: Record<string, string> = {},
): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json", ...headers },
	});
}

function htmlResponse(
	html: string,
	status = 200,
	headers: Record<string, string> = {},
): Response {
	return new Response(html, {
		status,
		headers: { "Content-Type": "text/html; charset=utf-8", ...headers },
	});
}

function redirectResponse(
	url: string,
	headers: Record<string, string> = {},
): Response {
	return new Response(null, {
		status: 302,
		headers: { Location: url, ...headers },
	});
}

// --- HTML Page Generators ---

export function generateLoginPageHtml(
	pocketbaseUrl: string,
	pocketbaseUrlMicrosoft?: string,
): string {
	const safePbUrl = escapeJs(pocketbaseUrl);
	const safePbUrlMicrosoft = escapeJs(pocketbaseUrlMicrosoft || pocketbaseUrl);
	return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Einloggen</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/infima@0.2.0-alpha.45/dist/css/default/default.min.css" />
  <style>
    .stack-vertically {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }
  </style>
</head>
<body>
<div class="container padding-top--lg">
  <h1>Bitte einloggen</h1>
  <p>Bitte logge Dich ein, um die Inhalte zu sehen.</p>
  <div class="stack-vertically padding-bottom--md">
    <button type="button" class="button button--primary" id="loginWithGithub">Login mit GitHub</button>
    <button type="button" class="button button--primary" id="loginWithGoogle">Login mit Google</button>
    <button type="button" class="button button--primary" id="loginWithMicrosoft">Login mit Microsoft</button>
  </div>

  <h2>FAQ</h2>

  <h3>Wie kann ich mir einen Account machen?</h3>

  <p>Es ist nicht nötig, einen Account anzulegen. Wenn Du einen Google-Account hast, drück auf "Login mit Google", wenn Du einen Github-Account hast, drück auf "Login mit GitHub". Folge danach jeweils den Anweisungen, die Du siehst.</p>

  <p>Wenn Du weder einen Account bei Google noch bei Github hast, drück einfach eine der beiden Schaltflächen und lege Dir einen neuen Account bei Google oder GitHub an (ich empfehle GitHub, das ist auch nützlich für die Bearbeitung der Inhalte und den Zugang zum Forum). Folge danach wieder den Anweisungen, die Du siehst. Falls Du dabei stecken bleibst, komm wieder auf diese Seite und klick wieder auf die gleiche Schaltfläche wie zuvor.</p>

  <h3>Warum bietest du keinen Login mit Benutzername und Passwort an?</h3>

  <p>Der Login mit Benutzername und Passwort, bzw. E-Mail und Passwort ist technisch überholt, weil er für Euch unbequem und unsicher und für mich als Seitenbetreiber sehr teuer ist. Die Authentifizierung über Anbieter wie Google oder Github ist dagegen günstig für mich und bequem und sicher für Euch.</p>

  <h4>Unbequem</h4>

  <p>Würde ich es Euch erlauben, Euch mit E-Mail-Adresse und Passwort anzumelden, müsstet ihr Euch ein neues Passwort ausdenken oder erstellen lassen. Dieses müsstet ihr entweder aufschreiben oder speichern. Alles sehr umständlich. Außerdem würden viele Nutzer:innen ein Passwort verwenden, was sie bereits schon woanders verwendet haben, was sehr <a href="https://www.bsi.bund.de/DE/Themen/Verbraucherinnen-und-Verbraucher/Informationen-und-Empfehlungen/Cyber-Sicherheitsempfehlungen/Accountschutz/Sichere-Passwoerter-erstellen/Umgang-mit-Passwoertern/umgang-mit-passwoertern_node.html#:~:text=Viele%20Anwenderinnen%20und,ebenfalls%20verwendet%20wird." target="_blank" rel="noopener noreferrer">gefährlich</a> ist.</p>

  <h4>Unsicher</h4>

  <p>Um den Zugang korrekt abzusichern, müsste ich zusätzlich Zwei-Faktor-Authentifizierung implementieren und anbieten. Das ist aber aus Aufwandsgründen nicht abbildbar. Insofern wäre nur ein einfacher Login mit E-Mail-Adresse und Passwort möglich, was nicht sicher ist.</p>

  <h4>Kosten</h4>

  <p>Login mit E-Mail-Adresse und Passwort bedeutet, dass ich:</p>

  <ul>
    <li><strong>Passwort-Resets</strong> anbieten müsste, was kompliziert und wartungsintensiv ist.</li>
    <li><strong>E-Mails</strong> verschicken müsste (z. B. für Bestätigungen oder Passwortänderungen), wofür ein zuverlässiger Mailserver notwendig ist – das kostet Geld und erfordert Pflege.</li>
    <li><strong>Sicherheitsmaßnahmen</strong> wie Hashing und Schutz gegen Angriffe ständig aktuell halten müsste.</li>
  </ul>

  <p>Das alles sind Ressourcen, die ich lieber in andere Bereiche investieren möchte.</p>

  <h4>Warum nutzt du Google und GitHub für den Login?</h4>

  <p>Die beiden Anbieter sind seriös und sicher. Um möglichst einfach an den Inhalten mitwirken zu können braucht man ohnehin einen Github-Account. Deshalb habe ich Github eingebunden. Viele wollen aber nur lesen. Für diese Leute habe ich Google eingebunden. Man kann auch beides gleichzeitig verwenden.</p>

  <p>Sowohl Github als auch Google bieten modernste Sicherheit für den Account und haben 2-Faktor-Authentifizierung und unterstützen sogar <a href="https://www.bsi.bund.de/DE/Themen/Verbraucherinnen-und-Verbraucher/Informationen-und-Empfehlungen/Cyber-Sicherheitsempfehlungen/Accountschutz/Passkeys/passkeys-anmelden-ohne-passwort_node.html" target="_blank" rel="noopener noreferrer">Passkeys</a>.</p>

  <p>Ich kann auch weitere Anbieter einbinden. Der Dienst, den ich benutze, unterstützt die folgenden Anbieter zusätzlich zu Google und GitHub:</p>

  <ul>
    <li>Microsoft</li>
    <li>Facebook</li>
    <li>GitLab</li>
    <li>Discord</li>
    <li>Spotify</li>
    <li>u.v.m.</li>
  </ul>

  <p>Wenn du dir einen dieser Anbieter wünschst, schreibe mir einfach eine E-Mail an <strong><a href="mailto:post@levinkeller.de">post@levinkeller.de</a></strong>. Ich prüfe dann, ob ich diesen Anbieter für den Login hinzufügen kann. Das ist allerdings relativ aufwendig. Prüfe bitte, ob es nicht doch leichter ist, wenn Du Dir einfach einen Google- oder Github-Account anlegst.</p>

</div>
<script src="https://cdn.jsdelivr.net/npm/pocketbase@0.26.0/dist/pocketbase.umd.min.js"></script>
<script>
  const pb = new PocketBase("${safePbUrl}");
  const pbMicrosoft = new PocketBase("${safePbUrlMicrosoft}");

  const saveTokenAndReload = (token) =>
    fetch('/api/cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(() => window.location.reload());

  document.getElementById('loginWithGithub').addEventListener('click', () =>
    pb.collection('users').authWithOAuth2({ provider: 'github' }).then(() => saveTokenAndReload(pb.authStore.token)));
  document.getElementById('loginWithGoogle').addEventListener('click', () =>
    pb.collection('users').authWithOAuth2({ provider: 'google' }).then(() => saveTokenAndReload(pb.authStore.token)));
  document.getElementById('loginWithMicrosoft').addEventListener('click', () =>
    pbMicrosoft.collection('users').authWithOAuth2({ provider: 'microsoft' }).then(() => saveTokenAndReload(pbMicrosoft.authStore.token)));
</script>
</body>
</html>`;
}

export function generateNotAMemberPageHtml(
	userEmail: string,
	groupName: string,
	pocketbaseUrl: string,
): string {
	const safeEmail = escapeHtml(userEmail);
	const safeEmailJs = escapeJs(userEmail);
	const safeGroupJs = escapeJs(groupName);
	const safePbUrlJs = escapeJs(pocketbaseUrl);
	return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Keine Berechtigung</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/infima@0.2.0-alpha.45/dist/css/default/default.min.css" />
</head>
<body>
  <div class="container padding-top--lg">
    <div class="alert alert--warning">
      <h3>Du bist eingeloggt, aber noch kein Mitglied</h3>
      <p>Du bist mit der E-Mail-Adresse <strong>${safeEmail}</strong> angemeldet.</p>
      <p>Bitte kontaktiere Levin, damit er deinen Account freischaltet.</p>
      <div class="padding-top--md">
        <button type="button" class="button button--primary" id="sendEmailButton">E-Mail an Levin senden</button>
      </div>
      <div class="padding-top--lg">
        <p>Mit dem falschen Account eingeloggt?</p>
        <form method="post" action="/api/logout">
          <button type="submit" class="button button--secondary">Ausloggen</button>
        </form>
      </div>
    </div>
  </div>
  <script>
    document.getElementById('sendEmailButton').addEventListener('click', () => {
      const subject = 'Aufnahme in die Gruppe "${safeGroupJs}"';
      const body = 'Hallo Levin,\\n\\nhier ist [BITTE NAMEN EINTRAGEN], ich habe mich gerade mit der E-Mail ${safeEmailJs} registriert und möchte gerne in die Gruppe "${safeGroupJs}" aufgenommen werden.\\n\\nPocketBase URL: ${safePbUrlJs}\\n\\nVielen Dank!\\n\\n[DEIN NAME]';
      window.open('mailto:post@levinkeller.de?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body), '_blank');
    });
  </script>
</body>
</html>`;
}

// --- Core Auth Functions ---

/**
 * Verify authentication from a request
 */
export async function verifyAuth(
	request: Request,
	options: PocketBaseAuthOptions,
): Promise<AuthResult> {
	const { pocketbaseUrl, groupField } = options;
	const pb = new PocketBase(pocketbaseUrl);
	const cookie = request.headers.get("Cookie");

	if (!cookie) {
		return { isAuthenticated: false, isAuthorized: false, error: "No cookie" };
	}

	pb.authStore.loadFromCookie(cookie);

	if (!pb.authStore.isValid) {
		return {
			isAuthenticated: false,
			isAuthorized: false,
			error: "Invalid cookie",
		};
	}

	try {
		await pb.collection("users").authRefresh();
	} catch {
		return {
			isAuthenticated: false,
			isAuthorized: false,
			error: "Auth refresh failed",
		};
	}

	const user = pb.authStore.record;
	if (!user) {
		return {
			isAuthenticated: false,
			isAuthorized: false,
			error: "No user record",
		};
	}

	try {
		const groups = await pb
			.collection("groups")
			.getFirstListItem(`user_id="${user.id}"`);

		if (groups[groupField]) {
			return {
				isAuthenticated: true,
				isAuthorized: true,
				user: { id: user.id, email: user.email },
			};
		}

		return {
			isAuthenticated: true,
			isAuthorized: false,
			user: { id: user.id, email: user.email },
			error: "Not in required group",
		};
	} catch {
		return {
			isAuthenticated: true,
			isAuthorized: false,
			user: { id: user.id, email: user.email },
			error: "Group check failed",
		};
	}
}

/**
 * Handle POST /api/cookie - converts OAuth token to HTTP-only cookie
 */
export async function handleCookieRequest(
	request: Request,
	pocketbaseUrl: string,
): Promise<Response> {
	if (request.method !== "POST") {
		return jsonResponse({ error: "Method not allowed" }, 405);
	}

	let body: { token?: string };
	try {
		body = (await request.json()) as { token?: string };
	} catch {
		return jsonResponse({ error: "Invalid JSON" }, 400);
	}

	const { token } = body;
	if (!token) {
		return jsonResponse({ error: "Token required" }, 400);
	}

	const pb = new PocketBase(pocketbaseUrl);
	pb.authStore.save(token);
	const authCookie = pb.authStore.exportToCookie({ sameSite: "None" });

	return jsonResponse({ success: true }, 200, { "Set-Cookie": authCookie });
}

/**
 * Handle POST /api/logout - clears cookie and redirects
 */
export function handleLogoutRequest(redirectUrl = "/"): Response {
	return redirectResponse(redirectUrl, {
		"Set-Cookie":
			"pb_auth=; Path=/; HttpOnly; SameSite=None; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
	});
}

/**
 * Handle GET /auth/verify - ForwardAuth endpoint for Traefik
 *
 * Returns:
 * - 200 OK with X-Auth-* headers if authenticated and authorized
 * - 401 Unauthorized if not authenticated
 * - 403 Forbidden if authenticated but not in required group
 */
export async function handleVerifyRequest(
	request: Request,
	options: PocketBaseAuthOptions,
): Promise<Response> {
	const result = await verifyAuth(request, options);

	if (!result.isAuthenticated) {
		return new Response("Unauthorized", {
			status: 401,
			headers: { "Content-Type": "text/plain" },
		});
	}

	if (!result.isAuthorized) {
		return new Response("Forbidden - not a group member", {
			status: 403,
			headers: { "Content-Type": "text/plain" },
		});
	}

	// Success - return 200 with auth headers for upstream
	const headers = new Headers({
		"Content-Type": "text/plain",
	});

	if (result.user) {
		headers.set("X-Auth-User", result.user.id);
		headers.set("X-Auth-Email", result.user.email || "");
	}

	if (options.groupField) {
		headers.set("X-Auth-Groups", options.groupField);
	}

	return new Response("OK", { status: 200, headers });
}

/**
 * Generate login page HTML with optional redirect URL support
 */
export function generateLoginPageHtmlWithRedirect(
	pocketbaseUrl: string,
	pocketbaseUrlMicrosoft?: string,
	redirectUrl?: string,
	allowedRedirectDomains?: string,
	publicUrl?: string,
): string {
	// Validate redirect URL if provided
	const safeRedirectUrl = redirectUrl
		? getSafeRedirectUrl(redirectUrl, allowedRedirectDomains, publicUrl, "")
		: "";

	const safePbUrl = escapeJs(pocketbaseUrl);
	const safePbUrlMicrosoft = escapeJs(pocketbaseUrlMicrosoft || pocketbaseUrl);
	const safeRedirect = escapeJs(safeRedirectUrl);

	// Generate the redirect script portion
	const redirectScript = safeRedirectUrl
		? `
      // Store redirect URL in cookie for after auth
      document.cookie = 'auth_redirect=${safeRedirect}; Path=/; Max-Age=300; SameSite=Lax';`
		: "";

	return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Einloggen</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/infima@0.2.0-alpha.45/dist/css/default/default.min.css" />
  <style>
    .stack-vertically {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }
  </style>
</head>
<body>
<div class="container padding-top--lg">
  <h1>Bitte einloggen</h1>
  <p>Bitte logge Dich ein, um die Inhalte zu sehen.</p>
  <div class="stack-vertically padding-bottom--md">
    <button type="button" class="button button--primary" id="loginWithGithub">Login mit GitHub</button>
    <button type="button" class="button button--primary" id="loginWithGoogle">Login mit Google</button>
    <button type="button" class="button button--primary" id="loginWithMicrosoft">Login mit Microsoft</button>
  </div>

  <h2>FAQ</h2>

  <h3>Wie kann ich mir einen Account machen?</h3>

  <p>Es ist nicht nötig, einen Account anzulegen. Wenn Du einen Google-Account hast, drück auf "Login mit Google", wenn Du einen Github-Account hast, drück auf "Login mit GitHub". Folge danach jeweils den Anweisungen, die Du siehst.</p>

  <p>Wenn Du weder einen Account bei Google noch bei Github hast, drück einfach eine der beiden Schaltflächen und lege Dir einen neuen Account bei Google oder GitHub an (ich empfehle GitHub, das ist auch nützlich für die Bearbeitung der Inhalte und den Zugang zum Forum). Folge danach wieder den Anweisungen, die Du siehst. Falls Du dabei stecken bleibst, komm wieder auf diese Seite und klick wieder auf die gleiche Schaltfläche wie zuvor.</p>

  <h3>Warum bietest du keinen Login mit Benutzername und Passwort an?</h3>

  <p>Der Login mit Benutzername und Passwort, bzw. E-Mail und Passwort ist technisch überholt, weil er für Euch unbequem und unsicher und für mich als Seitenbetreiber sehr teuer ist. Die Authentifizierung über Anbieter wie Google oder Github ist dagegen günstig für mich und bequem und sicher für Euch.</p>

  <h4>Unbequem</h4>

  <p>Würde ich es Euch erlauben, Euch mit E-Mail-Adresse und Passwort anzumelden, müsstet ihr Euch ein neues Passwort ausdenken oder erstellen lassen. Dieses müsstet ihr entweder aufschreiben oder speichern. Alles sehr umständlich. Außerdem würden viele Nutzer:innen ein Passwort verwenden, was sie bereits schon woanders verwendet haben, was sehr <a href="https://www.bsi.bund.de/DE/Themen/Verbraucherinnen-und-Verbraucher/Informationen-und-Empfehlungen/Cyber-Sicherheitsempfehlungen/Accountschutz/Sichere-Passwoerter-erstellen/Umgang-mit-Passwoertern/umgang-mit-passwoertern_node.html#:~:text=Viele%20Anwenderinnen%20und,ebenfalls%20verwendet%20wird." target="_blank" rel="noopener noreferrer">gefährlich</a> ist.</p>

  <h4>Unsicher</h4>

  <p>Um den Zugang korrekt abzusichern, müsste ich zusätzlich Zwei-Faktor-Authentifizierung implementieren und anbieten. Das ist aber aus Aufwandsgründen nicht abbildbar. Insofern wäre nur ein einfacher Login mit E-Mail-Adresse und Passwort möglich, was nicht sicher ist.</p>

  <h4>Kosten</h4>

  <p>Login mit E-Mail-Adresse und Passwort bedeutet, dass ich:</p>

  <ul>
    <li><strong>Passwort-Resets</strong> anbieten müsste, was kompliziert und wartungsintensiv ist.</li>
    <li><strong>E-Mails</strong> verschicken müsste (z. B. für Bestätigungen oder Passwortänderungen), wofür ein zuverlässiger Mailserver notwendig ist – das kostet Geld und erfordert Pflege.</li>
    <li><strong>Sicherheitsmaßnahmen</strong> wie Hashing und Schutz gegen Angriffe ständig aktuell halten müsste.</li>
  </ul>

  <p>Das alles sind Ressourcen, die ich lieber in andere Bereiche investieren möchte.</p>

  <h4>Warum nutzt du Google und GitHub für den Login?</h4>

  <p>Die beiden Anbieter sind seriös und sicher. Um möglichst einfach an den Inhalten mitwirken zu können braucht man ohnehin einen Github-Account. Deshalb habe ich Github eingebunden. Viele wollen aber nur lesen. Für diese Leute habe ich Google eingebunden. Man kann auch beides gleichzeitig verwenden.</p>

  <p>Sowohl Github als auch Google bieten modernste Sicherheit für den Account und haben 2-Faktor-Authentifizierung und unterstützen sogar <a href="https://www.bsi.bund.de/DE/Themen/Verbraucherinnen-und-Verbraucher/Informationen-und-Empfehlungen/Cyber-Sicherheitsempfehlungen/Accountschutz/Passkeys/passkeys-anmelden-ohne-passwort_node.html" target="_blank" rel="noopener noreferrer">Passkeys</a>.</p>

  <p>Ich kann auch weitere Anbieter einbinden. Der Dienst, den ich benutze, unterstützt die folgenden Anbieter zusätzlich zu Google und GitHub:</p>

  <ul>
    <li>Microsoft</li>
    <li>Facebook</li>
    <li>GitLab</li>
    <li>Discord</li>
    <li>Spotify</li>
    <li>u.v.m.</li>
  </ul>

  <p>Wenn du dir einen dieser Anbieter wünschst, schreibe mir einfach eine E-Mail an <strong><a href="mailto:post@levinkeller.de">post@levinkeller.de</a></strong>. Ich prüfe dann, ob ich diesen Anbieter für den Login hinzufügen kann. Das ist allerdings relativ aufwendig. Prüfe bitte, ob es nicht doch leichter ist, wenn Du Dir einfach einen Google- oder Github-Account anlegst.</p>

</div>
<script src="https://cdn.jsdelivr.net/npm/pocketbase@0.26.0/dist/pocketbase.umd.min.js"></script>
<script>
  const pb = new PocketBase("${safePbUrl}");
  const pbMicrosoft = new PocketBase("${safePbUrlMicrosoft}");
  ${redirectScript}

  const saveTokenAndReload = (token) =>
    fetch('/api/cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(() => {
      // Check for redirect cookie
      const cookies = document.cookie.split(';');
      const redirectCookie = cookies.find(c => c.trim().startsWith('auth_redirect='));
      if (redirectCookie) {
        const redirectUrl = redirectCookie.split('=')[1];
        // Clear the cookie
        document.cookie = 'auth_redirect=; Path=/; Max-Age=0';
        if (redirectUrl) {
          window.location.href = decodeURIComponent(redirectUrl);
          return;
        }
      }
      window.location.reload();
    });

  document.getElementById('loginWithGithub').addEventListener('click', () =>
    pb.collection('users').authWithOAuth2({ provider: 'github' }).then(() => saveTokenAndReload(pb.authStore.token)));
  document.getElementById('loginWithGoogle').addEventListener('click', () =>
    pb.collection('users').authWithOAuth2({ provider: 'google' }).then(() => saveTokenAndReload(pb.authStore.token)));
  document.getElementById('loginWithMicrosoft').addEventListener('click', () =>
    pbMicrosoft.collection('users').authWithOAuth2({ provider: 'microsoft' }).then(() => saveTokenAndReload(pbMicrosoft.authStore.token)));
</script>
</body>
</html>`;
}

/**
 * Create auth middleware for edge runtimes (Cloudflare Pages, etc.)
 *
 * Returns null if authenticated and authorized, otherwise returns a Response
 */
export function createAuthMiddleware(options: PocketBaseAuthOptions) {
	const { pocketbaseUrl, pocketbaseUrlMicrosoft, groupField } = options;

	return async (request: Request): Promise<Response | null> => {
		const result = await verifyAuth(request, options);

		if (!result.isAuthenticated) {
			return htmlResponse(
				generateLoginPageHtml(pocketbaseUrl, pocketbaseUrlMicrosoft),
				401,
			);
		}

		if (!result.isAuthorized && result.user) {
			return htmlResponse(
				generateNotAMemberPageHtml(
					result.user.email,
					groupField,
					pocketbaseUrl,
				),
				403,
			);
		}

		return null; // Proceed with request
	};
}

/**
 * Handle all auth-related requests
 *
 * Use this as a catch-all handler in your edge function
 */
export async function handleAuthRequest(
	request: Request,
	options: PocketBaseAuthOptions,
): Promise<Response | null> {
	// Validate required options
	if (!options.pocketbaseUrl) {
		return htmlResponse(
			"<h1>Configuration Error</h1><p>POCKETBASE_URL environment variable is not set.</p>",
			500,
		);
	}
	if (!options.groupField) {
		return htmlResponse(
			"<h1>Configuration Error</h1><p>POCKETBASE_GROUP environment variable is not set.</p>",
			500,
		);
	}

	const url = new URL(request.url);

	// ForwardAuth verify endpoint
	if (url.pathname === "/auth/verify" && request.method === "GET") {
		return handleVerifyRequest(request, options);
	}

	if (url.pathname === "/api/cookie" && request.method === "POST") {
		return handleCookieRequest(request, options.pocketbaseUrl);
	}

	if (url.pathname === "/api/logout" && request.method === "POST") {
		return handleLogoutRequest("/");
	}

	// Handle login page with optional redirect parameter
	if (url.pathname === "/login" && request.method === "GET") {
		const redirectUrl = url.searchParams.get("rd") || undefined;
		return htmlResponse(
			generateLoginPageHtmlWithRedirect(
				options.pocketbaseUrl,
				options.pocketbaseUrlMicrosoft,
				redirectUrl,
				options.allowedRedirectDomains,
				options.publicUrl,
			),
			200,
		);
	}

	const authMiddleware = createAuthMiddleware(options);
	return authMiddleware(request);
}
