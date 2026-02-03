import type { APIContext, APIRoute } from "astro"
import { Effect, pipe, Schema, Struct } from "effect"

import PocketBase from "pocketbase"
import authConfig from "../../authConfig"

// Prefer using Effect.Schema over parsing or validating manually. We will have nice types from here on.
const CookieRequest = Schema.Struct({
	token: Schema.NonEmptyString,
})

// This is a very ugly api we have to use, even creating some local state. So we wrap it to not see this mess in our flow.
const tokenToCookie = (token: string) =>
	Effect.try(() => {
		const pocketBase = new PocketBase(authConfig.pocketbaseUrl)
		pocketBase.authStore.save(token, null)
		return pocketBase.authStore.exportToCookie({
			sameSite: "Lax",
			secure: true,
		})
	})

// Wrap disgusting apis so we can use them in our flow without much noise.
const createResponseToSetCookie = (cookie: string) =>
	new Response("OK", { status: 200, headers: { "Set-Cookie": cookie } })

// Railway oriented programming: Ignoring errors until the end, focussing on the happy path
const handleCookieRequest = (context: APIContext) =>
	pipe(
		context,
		Struct.get("request"),
		Schema.decodeUnknown(CookieRequest),
		Effect.map(({ token }) => token),
		Effect.flatMap(tokenToCookie),
		Effect.map(createResponseToSetCookie),
	)

// Wrap disgusting apis so we can use them in our flow without much noise.
const handleError = () =>
	Effect.succeed(new Response("Invalid request", { status: 400 }))

// Here we handle the unhappy paths.
export const POST: APIRoute = (context) =>
	Effect.runPromise(
		pipe(handleCookieRequest(context), Effect.catchAll(handleError)),
	)
