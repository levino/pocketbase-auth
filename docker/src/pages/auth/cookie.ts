import type { APIRoute } from "astro"
import PocketBase from "pocketbase"
import authConfig from "../../authConfig"

export const POST: APIRoute = async (context) => {
	try {
		const { token } = await context.request.json()
		console.log("[auth/cookie] Received token:", token ? `${token.slice(0, 20)}...` : "NONE")
		if (!token) {
			return new Response("Missing token", { status: 400 })
		}

		const pb = new PocketBase(authConfig.pocketbaseUrl)
		pb.authStore.save(token, null)
		const cookie = pb.authStore.exportToCookie({
			sameSite: "Lax",
			secure: true,
		})
		console.log("[auth/cookie] Set-Cookie header:", cookie.slice(0, 80) + "...")

		return new Response("OK", {
			status: 200,
			headers: { "Set-Cookie": cookie },
		})
	} catch (error) {
		console.error("[auth/cookie] Failed to set cookie:", error)
		return new Response("Invalid request", { status: 400 })
	}
}
