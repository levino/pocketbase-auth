# Demo: Coolify / Docker Compose

Protects an nginx hello-world server with PocketBase auth using Traefik ForwardAuth.

## Architecture

```mermaid
graph LR
    Browser -->|app.localhost| Traefik
    Traefik -->|ForwardAuth| Auth[Auth Service<br>Astro]
    Auth -->|200 OK| Traefik
    Traefik -->|proxy| Nginx[nginx<br>hello world]
    Browser -->|auth.localhost| Auth
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

```mermaid
sequenceDiagram
    participant B as Browser
    participant T as Traefik
    participant A as Auth Service
    participant N as nginx

    B->>T: GET app.localhost
    T->>A: GET /auth/verify (ForwardAuth)
    alt Not logged in
        A-->>T: 401 Unauthorized
        T-->>B: Redirect to auth.localhost/login
        B->>A: Login via OAuth
        A-->>B: Set cookie, redirect back
    end
    B->>T: GET app.localhost (with cookie)
    T->>A: GET /auth/verify
    A-->>T: 200 OK + X-Auth-User header
    T->>N: Proxy request
    N-->>T: hello.html
    T-->>B: hello.html
```

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
