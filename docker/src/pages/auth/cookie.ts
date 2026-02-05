import type { APIRoute } from "astro"
import PocketBase from "pocketbase"
import authConfig from "../../authConfig"

export const POST: APIRoute = async (context) => {
	try {
		const { token } = await context.request.json()
		if (!token) {
			return new Response("Missing token", { status: 400 })
		}

		const pb = new PocketBase(authConfig.pocketbaseUrl)
		pb.authStore.save(token, null)
		const cookie = pb.authStore.exportToCookie({
			sameSite: "Lax",
			secure: true,
		})

		return new Response("OK", {
			status: 200,
			headers: { "Set-Cookie": cookie },
		})
	} catch (error) {
		console.error("[auth/cookie] Failed to set cookie:", error)
		return new Response("Invalid request", { status: 400 })
	}
}
