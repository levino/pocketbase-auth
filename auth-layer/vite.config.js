import { resolve } from "node:path"
import { defineConfig } from "vite"
import handlebars from "vite-plugin-handlebars"

export default defineConfig({
	plugins: [
		handlebars({
			partialDirectory: resolve(process.cwd(), "views/partials"),
			context: {
				// Default mock data for development
				pocketbaseUrl: "http://localhost:8090",
				pocketbaseUrlMicrosoft: "http://localhost:8090",
				userEmail: "test@example.com",
				groupName: "members",
			},
		}),
	],
	root: "views",
	server: {
		open: "login.html",
		host: true,
	},
	build: {
		outDir: "../dist",
		rollupOptions: {
			input: {
				login: resolve(process.cwd(), "views/login.html"),
				"not-member": resolve(process.cwd(), "views/not_a_member.html"),
			},
		},
	},
})
