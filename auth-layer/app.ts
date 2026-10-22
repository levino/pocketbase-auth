import { createApp } from "./index.ts"

const app = createApp()
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`)
})
