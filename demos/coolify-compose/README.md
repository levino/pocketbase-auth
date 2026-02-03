# Demo: Coolify / Docker Compose

Protects an nginx hello-world server with PocketBase auth using Traefik ForwardAuth.

## Architecture

```
Browser → Traefik → ForwardAuth → auth service (Astro)
              ↓                       ↓
         app.localhost          auth.localhost
              ↓
       nginx hello world
```

## Setup

1. Edit `docker-compose.yml` and set your `POCKETBASE_URL` and `POCKETBASE_GROUP`

2. Customize the auth pages in `auth/src/pages/` (login, access-denied, etc.)

3. Run:
   ```bash
   docker compose up
   ```

4. Open:
   - http://app.localhost - Protected hello world (requires login)
   - http://auth.localhost - Auth service (login page)

## How it works

1. You visit `app.localhost`
2. Traefik calls `auth:3000/auth/verify` (ForwardAuth)
3. Not logged in → 401 → Traefik can redirect to login
4. Logged in + in group → 200 → Traefik forwards to nginx
5. nginx serves `hello.html`

## Adapt for your use case

Replace `hello` service with your actual service (Fava, Grafana, any web app):

```yaml
  my-app:
    image: my-app:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.my-app.rule=Host(`my-app.localhost`)"
      - "traefik.http.routers.my-app.middlewares=pb-auth@docker"
      - "traefik.http.services.my-app.loadbalancer.server.port=8080"
```
