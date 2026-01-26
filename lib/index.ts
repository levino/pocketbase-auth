import { Data, Effect, pipe } from "effect";
import PocketBase from "pocketbase";

// --- Configuration ---

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
}

// --- Typed Errors (Railway Oriented Programming) ---

/** Base class for all auth errors */
export class AuthError extends Data.TaggedError("AuthError")<{
	readonly reason:
		| "NoCookie"
		| "InvalidCookie"
		| "AuthRefreshFailed"
		| "NoUserRecord"
		| "NotInRequiredGroup"
		| "GroupCheckFailed";
	readonly message: string;
	readonly cause?: unknown;
}> {}

/** Error for missing configuration */
export class ConfigurationError extends Data.TaggedError("ConfigurationError")<{
	readonly field: string;
	readonly message: string;
}> {}

/** Error for invalid HTTP requests */
export class RequestError extends Data.TaggedError("RequestError")<{
	readonly reason: "MethodNotAllowed" | "InvalidJson" | "MissingToken";
	readonly message: string;
	readonly statusCode: number;
}> {}

// --- Success Types ---

export interface AuthenticatedUser {
	id: string;
	email: string;
}

export interface AuthResult {
	user: AuthenticatedUser;
	pb: PocketBase;
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

// --- Core Auth Functions (Effect-based) ---

/**
 * Extract and validate cookie from request
 */
const extractCookie = (request: Request) =>
	Effect.gen(function* () {
		const cookie = request.headers.get("Cookie");
		if (!cookie) {
			return yield* new AuthError({
				reason: "NoCookie",
				message: "No authentication cookie present",
			});
		}
		return cookie;
	});

/**
 * Load and validate auth store from cookie
 */
const loadAuthStore = (pb: PocketBase, cookie: string) =>
	Effect.gen(function* () {
		pb.authStore.loadFromCookie(cookie);
		if (!pb.authStore.isValid) {
			return yield* new AuthError({
				reason: "InvalidCookie",
				message: "Authentication cookie is invalid or expired",
			});
		}
		return pb;
	});

/**
 * Refresh authentication with PocketBase
 */
const refreshAuth = (pb: PocketBase) =>
	Effect.tryPromise({
		try: () => pb.collection("users").authRefresh(),
		catch: (error) =>
			new AuthError({
				reason: "AuthRefreshFailed",
				message: "Failed to refresh authentication with PocketBase",
				cause: error,
			}),
	}).pipe(Effect.map(() => pb));

/**
 * Extract user record from auth store
 */
const extractUserRecord = (pb: PocketBase) =>
	Effect.gen(function* () {
		const user = pb.authStore.record;
		if (!user) {
			return yield* new AuthError({
				reason: "NoUserRecord",
				message: "No user record found in auth store",
			});
		}
		return { user: { id: user.id, email: user.email }, pb };
	});

/**
 * Check if user belongs to required group
 */
const checkGroupMembership = (
	pb: PocketBase,
	user: AuthenticatedUser,
	groupField: string,
) =>
	pipe(
		Effect.tryPromise({
			try: () =>
				pb.collection("groups").getFirstListItem(`user_id="${user.id}"`),
			catch: (error) =>
				new AuthError({
					reason: "GroupCheckFailed",
					message: "Failed to check group membership",
					cause: error,
				}),
		}),
		Effect.flatMap((groups) => {
			if (groups[groupField]) {
				return Effect.succeed({ user, pb });
			}
			return Effect.fail(
				new AuthError({
					reason: "NotInRequiredGroup",
					message: `User is not a member of the required group (${groupField})`,
				}),
			);
		}),
	);

/**
 * Verify authentication from a request
 *
 * Returns Effect<AuthResult, AuthError> - success with user info, or typed error
 */
export const verifyAuth = (
	request: Request,
	options: PocketBaseAuthOptions,
): Effect.Effect<AuthResult, AuthError> => {
	const { pocketbaseUrl, groupField } = options;

	return Effect.gen(function* () {
		const pb = new PocketBase(pocketbaseUrl);

		// Railway: each step can fail with AuthError
		const cookie = yield* extractCookie(request);
		yield* loadAuthStore(pb, cookie);
		yield* refreshAuth(pb);
		const { user } = yield* extractUserRecord(pb);
		return yield* checkGroupMembership(pb, user, groupField);
	});
};

/**
 * Parse JSON body from request
 */
const parseJsonBody = (request: Request) =>
	Effect.tryPromise({
		try: () => request.json() as Promise<{ token?: string }>,
		catch: () =>
			new RequestError({
				reason: "InvalidJson",
				message: "Request body is not valid JSON",
				statusCode: 400,
			}),
	});

/**
 * Extract token from parsed body
 */
const extractToken = (body: { token?: string }) =>
	Effect.gen(function* () {
		if (!body.token) {
			return yield* new RequestError({
				reason: "MissingToken",
				message: "Token is required in request body",
				statusCode: 400,
			});
		}
		return body.token;
	});

/**
 * Handle POST /api/cookie - converts OAuth token to HTTP-only cookie
 *
 * Returns Effect<Response, RequestError>
 */
export const handleCookieRequest = (
	request: Request,
	pocketbaseUrl: string,
): Effect.Effect<Response, RequestError> =>
	Effect.gen(function* () {
		// Validate method
		if (request.method !== "POST") {
			return yield* new RequestError({
				reason: "MethodNotAllowed",
				message: "Only POST method is allowed",
				statusCode: 405,
			});
		}

		const body = yield* parseJsonBody(request);
		const token = yield* extractToken(body);

		const pb = new PocketBase(pocketbaseUrl);
		pb.authStore.save(token);
		const authCookie = pb.authStore.exportToCookie({ sameSite: "None" });

		return jsonResponse({ success: true }, 200, { "Set-Cookie": authCookie });
	});

/**
 * Handle POST /api/logout - clears cookie and redirects
 */
export const handleLogoutRequest = (redirectUrl = "/"): Response =>
	redirectResponse(redirectUrl, {
		"Set-Cookie":
			"pb_auth=; Path=/; HttpOnly; SameSite=None; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
	});

/**
 * Validate configuration options
 */
const validateConfig = (options: PocketBaseAuthOptions) =>
	Effect.gen(function* () {
		if (!options.pocketbaseUrl) {
			return yield* new ConfigurationError({
				field: "pocketbaseUrl",
				message: "POCKETBASE_URL environment variable is not set",
			});
		}
		if (!options.groupField) {
			return yield* new ConfigurationError({
				field: "groupField",
				message: "POCKETBASE_GROUP environment variable is not set",
			});
		}
		return options;
	});

/**
 * Convert AuthError to appropriate HTTP Response
 */
export const authErrorToResponse = (
	error: AuthError,
	options: PocketBaseAuthOptions,
): Response => {
	const { pocketbaseUrl, pocketbaseUrlMicrosoft, groupField } = options;

	switch (error.reason) {
		case "NoCookie":
		case "InvalidCookie":
		case "AuthRefreshFailed":
		case "NoUserRecord":
			return htmlResponse(
				generateLoginPageHtml(pocketbaseUrl, pocketbaseUrlMicrosoft),
				401,
			);

		case "NotInRequiredGroup":
		case "GroupCheckFailed":
			// For these errors we need user info - but we might not have it
			// This is a limitation - we'll show a generic message
			return htmlResponse(
				generateNotAMemberPageHtml("unknown", groupField, pocketbaseUrl),
				403,
			);
	}
};

/**
 * Convert RequestError to HTTP Response
 */
export const requestErrorToResponse = (error: RequestError): Response =>
	jsonResponse({ error: error.message }, error.statusCode);

/**
 * Convert ConfigurationError to HTTP Response
 */
export const configErrorToResponse = (error: ConfigurationError): Response =>
	htmlResponse(
		`<h1>Configuration Error</h1><p>${escapeHtml(error.message)}</p>`,
		500,
	);

/**
 * Create auth middleware for edge runtimes (Cloudflare Pages, etc.)
 *
 * Returns null if authenticated and authorized, otherwise returns a Response
 */
export const createAuthMiddleware = (options: PocketBaseAuthOptions) => {
	const { pocketbaseUrl, pocketbaseUrlMicrosoft, groupField } = options;

	return async (request: Request): Promise<Response | null> => {
		const result = await Effect.runPromise(
			pipe(
				verifyAuth(request, options),
				Effect.map(() => null as Response | null),
				Effect.catchTag("AuthError", (error) => {
					// For NotInRequiredGroup/GroupCheckFailed, we need to get user info
					// Run a partial auth to get user email for the error page
					if (
						error.reason === "NotInRequiredGroup" ||
						error.reason === "GroupCheckFailed"
					) {
						return pipe(
							getUserForErrorPage(request, options),
							Effect.map((user) =>
								htmlResponse(
									generateNotAMemberPageHtml(
										user.email,
										groupField,
										pocketbaseUrl,
									),
									403,
								),
							),
							Effect.catchAll(() =>
								Effect.succeed(
									htmlResponse(
										generateNotAMemberPageHtml(
											"unknown",
											groupField,
											pocketbaseUrl,
										),
										403,
									),
								),
							),
						);
					}
					return Effect.succeed(
						htmlResponse(
							generateLoginPageHtml(pocketbaseUrl, pocketbaseUrlMicrosoft),
							401,
						),
					);
				}),
			),
		);
		return result;
	};
};

/**
 * Helper to get user info for error pages (partial auth without group check)
 */
const getUserForErrorPage = (
	request: Request,
	options: PocketBaseAuthOptions,
): Effect.Effect<AuthenticatedUser, AuthError> => {
	const { pocketbaseUrl } = options;

	return Effect.gen(function* () {
		const pb = new PocketBase(pocketbaseUrl);
		const cookie = yield* extractCookie(request);
		yield* loadAuthStore(pb, cookie);
		yield* refreshAuth(pb);
		const { user } = yield* extractUserRecord(pb);
		return user;
	});
};

/**
 * Handle all auth-related requests
 *
 * Use this as a catch-all handler in your edge function
 */
export const handleAuthRequest = async (
	request: Request,
	options: PocketBaseAuthOptions,
): Promise<Response | null> => {
	// Validate config first
	const configResult = await Effect.runPromiseExit(validateConfig(options));

	if (configResult._tag === "Failure") {
		const error = configResult.cause;
		if (error._tag === "Fail" && error.error._tag === "ConfigurationError") {
			return configErrorToResponse(error.error);
		}
		return htmlResponse("<h1>Unknown Error</h1>", 500);
	}

	const url = new URL(request.url);

	// Handle cookie endpoint
	if (url.pathname === "/api/cookie" && request.method === "POST") {
		const result = await Effect.runPromiseExit(
			handleCookieRequest(request, options.pocketbaseUrl),
		);

		if (result._tag === "Failure") {
			const error = result.cause;
			if (error._tag === "Fail" && error.error._tag === "RequestError") {
				return requestErrorToResponse(error.error);
			}
			return jsonResponse({ error: "Unknown error" }, 500);
		}
		return result.value;
	}

	// Handle logout endpoint
	if (url.pathname === "/api/logout" && request.method === "POST") {
		return handleLogoutRequest("/");
	}

	// Run auth middleware
	const authMiddleware = createAuthMiddleware(options);
	return authMiddleware(request);
};

// --- Legacy API (for backwards compatibility during migration) ---

/**
 * @deprecated Use verifyAuth with Effect.runPromise instead
 *
 * Legacy result type for backwards compatibility
 */
export interface LegacyAuthResult {
	isAuthenticated: boolean;
	isAuthorized: boolean;
	user?: { id: string; email: string };
	error?: string;
}

/**
 * @deprecated Use verifyAuth with Effect.runPromise instead
 *
 * Legacy wrapper that converts Effect-based verifyAuth to old return format
 */
export const verifyAuthLegacy = async (
	request: Request,
	options: PocketBaseAuthOptions,
): Promise<LegacyAuthResult> => {
	const result = await Effect.runPromiseExit(verifyAuth(request, options));

	if (result._tag === "Success") {
		return {
			isAuthenticated: true,
			isAuthorized: true,
			user: result.value.user,
		};
	}

	const cause = result.cause;
	if (cause._tag === "Fail" && cause.error._tag === "AuthError") {
		const error = cause.error;

		switch (error.reason) {
			case "NoCookie":
			case "InvalidCookie":
			case "AuthRefreshFailed":
			case "NoUserRecord":
				return {
					isAuthenticated: false,
					isAuthorized: false,
					error: error.message,
				};

			case "NotInRequiredGroup":
			case "GroupCheckFailed": {
				// Try to get user info
				const userResult = await Effect.runPromiseExit(
					getUserForErrorPage(request, options),
				);
				if (userResult._tag === "Success") {
					return {
						isAuthenticated: true,
						isAuthorized: false,
						user: userResult.value,
						error: error.message,
					};
				}
				return {
					isAuthenticated: true,
					isAuthorized: false,
					error: error.message,
				};
			}
		}
	}

	return {
		isAuthenticated: false,
		isAuthorized: false,
		error: "Unknown error",
	};
};

/**
 * @deprecated Use handleCookieRequest with Effect.runPromise instead
 */
export const handleCookieRequestLegacy = async (
	request: Request,
	pocketbaseUrl: string,
): Promise<Response> => {
	const result = await Effect.runPromiseExit(
		handleCookieRequest(request, pocketbaseUrl),
	);

	if (result._tag === "Success") {
		return result.value;
	}

	const cause = result.cause;
	if (cause._tag === "Fail" && cause.error._tag === "RequestError") {
		return requestErrorToResponse(cause.error);
	}

	return jsonResponse({ error: "Unknown error" }, 500);
};
