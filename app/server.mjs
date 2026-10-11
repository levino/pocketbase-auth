import { createServer } from "node:http"

const port = process.env.PORT || 3000

const html = (user, email) => `<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; }
    .card { background: #f8f9fa; border: 1px solid #dee2e6; padding: 24px; border-radius: 8px; }
    h1 { margin: 0 0 16px; }
    dt { font-weight: 600; margin-top: 12px; }
    dd { margin: 4px 0 0; color: #495057; font-family: monospace; }
    p { color: #6c757d; margin-top: 16px; font-size: 14px; }
    button { margin-top: 16px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
    button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <h1>My App</h1>
    <dl>
      <dt>X-Auth-User</dt>
      <dd>${user || "-"}</dd>
      <dt>X-Auth-Email</dt>
      <dd>${email || "-"}</dd>
    </dl>
    <p>This app has zero auth logic. Traefik ForwardAuth handles everything.</p>
    <form action="/auth/logout" method="POST">
      <button type="submit">Sign out</button>
    </form>
  </div>
</body>
</html>`

createServer((req, res) => {
  const user = req.headers["x-auth-user"]
  const email = req.headers["x-auth-email"]
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
  res.end(html(user, email))
}).listen(port, () => {
  console.log(`App listening on port ${port}`)
})
