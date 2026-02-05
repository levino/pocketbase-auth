import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
	base: "/auth",
	output: "server",
	adapter: node({
		mode: "standalone",
	}),
	vite: {
		plugins: [tailwindcss()],
	},
});
