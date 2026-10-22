import path from "node:path"
import cookieParser from "cookie-parser"
import express, { type Request, type Response } from "express"
import hbs from "hbs"
import PocketBase from "pocketbase"

const __dirname = import.meta.dirname

export function createApp() {
	return express()
		.use(cookieParser())
		.use("/public", express.static(path.join(__dirname, "/build/public")))
		.use("/api", express.json())
		.post("/api/cookie", async (req: Request, res: Response) => {
			const pb = new PocketBase(process.env.POCKETBASE_URL)
			try {
				const { token } = req.body

				if (!token) {
					return res.status(400).send("Auth token is missing")
				}

				pb.authStore.save(token)

				const authCookie = pb.authStore.exportToCookie({ sameSite: "None" })

				res.setHeader("Set-Cookie", authCookie)
				res.status(200).json({})
			} catch (_error) {
				res.status(500).send("Internal server error")
			}
		})
		.post("/api/logout", (_req: Request, res: Response) => {
			// Clear the HTTP-only cookie by setting it to expire immediately
			res.setHeader(
				"Set-Cookie",
				"pb_auth=; Path=/; HttpOnly; SameSite=None; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
			)

			// Redirect to home page
			res.redirect("/")
		})
		.set("view engine", "html")
		.engine("html", hbs.__express)
		.set("views", path.join(process.cwd(), "views"))
		.use(async (req: Request, res: Response, next) => {
			const pb = new PocketBase(process.env.POCKETBASE_URL)
			const cookie = req.headers.cookie

			if (!cookie) {
				return res.status(401).render("login", {
					pocketbaseUrl: process.env.POCKETBASE_URL,
					pocketbaseUrlMicrosoft:
						process.env.POCKETBASE_URL_MICROSOFT || process.env.POCKETBASE_URL,
				})
			}

			pb.authStore.loadFromCookie(cookie)

			try {
				await pb.collection("users").authRefresh()
				const groups = await pb
					.collection("groups")
					.getFirstListItem(`user_id="${pb.authStore.record.id}"`)
				if (groups[process.env.POCKETBASE_GROUP]) {
					return next()
				}
				return res.status(401).render("not_a_member", {
					userEmail: pb.authStore.record.email,
					groupName: process.env.POCKETBASE_GROUP,
					pocketbaseUrl: process.env.POCKETBASE_URL,
				})
			} catch (_error) {
				return res.status(401).render("login", {
					pocketbaseUrl: process.env.POCKETBASE_URL,
					pocketbaseUrlMicrosoft:
						process.env.POCKETBASE_URL_MICROSOFT || process.env.POCKETBASE_URL,
				})
			}
		})
		.use(express.static(path.join(__dirname, "/build")))
}
