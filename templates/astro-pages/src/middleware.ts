import PocketBase from "pocketbase"
import { defineMiddleware } from "astro:middleware"
import { Context, Data, Effect, Either, pipe } from "effect"
import authConfig from "./authConfig"
import type { APIContext, MiddlewareNext } from "astro"

class PocketBaseService extends Context.Tag("PocketBaseService")<
	PocketBaseService,
	PocketBase
>() {}

class MissingCookieError extends Data.TaggedError("MissingCookieError")<{}> {}
class InvalidAuthError extends Data.TaggedError("InvalidAuthError")<{}> {}
class AccessDeniedError extends Data.TaggedError("AccessDeniedError")<{}> {}

const storeCookie = (cookie: string) =>
	Effect.gen(function* () {
		const pocketBase = yield* PocketBaseService
		pocketBase.authStore.loadFromCookie(cookie)
	})

const refreshAuth = Effect.gen(function* () {
	const pocketBase = yield* PocketBaseService
	yield* Effect.tryPromise(() => pocketBase.collection("users").authRefresh())
})

const getUser = Effect.gen(function* () {
	const pocketBase = yield* PocketBaseService
	const user = pocketBase.authStore.record
	if (!user) return yield* Effect.fail(new InvalidAuthError())
	return user
})

const checkGroupAccess = Effect.gen(function* () {
	const pocketBase = yield* PocketBaseService
	const user = yield* getUser
	const groups = yield* Effect.tryPromise(() =>
		pocketBase.collection("groups").getFirstListItem(`user_id="${user.id}"`),
	)
	if (!groups[authConfig.pocketbaseGroup])
		yield* Effect.fail(new AccessDeniedError())
})

const verifyGroupMembership = (cookie: string) =>
	pipe(
		storeCookie(cookie),
		Effect.andThen(refreshAuth),
		Effect.andThen(checkGroupAccess),
	)

const withPocketBase =
	<A, E>(
		effectFn: (cookie: string) => Effect.Effect<A, E, PocketBaseService>,
		pocketBase: PocketBase,
	) =>
	(cookie: string) =>
		Effect.provideService(effectFn(cookie), PocketBaseService, pocketBase)

const pathStartsWithAuth = (
	context: APIContext,
): Either.Either<"public", string> =>
	context.url.pathname.startsWith("/auth/")
		? Either.right("public" as const)
		: Either.left(context.url.pathname)

const getCookie = (
	context: APIContext,
): Effect.Effect<string, MissingCookieError> => {
	const cookie = context.request.headers.get("cookie")
	return cookie ? Effect.succeed(cookie) : Effect.fail(new MissingCookieError())
}

const call =
	<A>(fn: () => Promise<A>) =>
	() =>
		Effect.promise(fn)

const readCookieAndCheckGroupMembership = (
	context: APIContext,
	next: MiddlewareNext,
) =>
	pipe(
		getCookie(context),
		// The PocketBase instance could also be created implicitly inside withPocketBase.
		// We do it here so it is easy to verify that users never share a PocketBase instance,
		// which would be a security issue.
		Effect.flatMap(
			withPocketBase(
				verifyGroupMembership,
				new PocketBase(authConfig.pocketbaseUrl),
			),
		),
		Effect.flatMap(call(next)),
	)

const handleRequest = (context: APIContext, next: MiddlewareNext) =>
	pipe(
		pathStartsWithAuth(context),
		Either.map(call(next)),
		Either.mapLeft(() => readCookieAndCheckGroupMembership(context, next)),
		Either.merge,
	)

export const onRequest = defineMiddleware((context, next) =>
	Effect.runPromise(handleRequest(context, next)),
)
