# PocketBase Auth - Docker Service

Complete Astro app with Docker support. Use as a standalone auth service in your Docker/Coolify stack.

## Quick Start

```bash
# Copy to your monorepo
npx giget gh:levino/pocketbase-auth/templates/astro-docker apps/auth

# Configure
cd apps/auth
cp .env.example .env  # Edit with your PocketBase URL

# Run with Docker Compose
docker compose up
```

## Usage

### With Traefik (ForwardAuth)

See `docker-compose.yml` for a complete example with:
- Traefik reverse proxy
- Auth service with ForwardAuth endpoint
- Protected hello-world service

Access:
- `http://auth.localhost` - Login page
- `http://app.localhost` - Protected app (requires login)

### With Coolify

1. Add this as a service in your Coolify project
2. Set environment variables:
   - `POCKETBASE_URL`
   - `POCKETBASE_GROUP`
3. Configure Traefik ForwardAuth middleware pointing to `/auth/verify`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POCKETBASE_URL` | Yes | Your PocketBase instance URL |
| `POCKETBASE_GROUP` | Yes | Group field name for access control |

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/login` | GET | Login page |
| `/access-denied` | GET | Shown when not in group |
| `/auth/verify` | GET | ForwardAuth endpoint (200/401/403) |
| `/auth/cookie` | POST | Set auth cookie from token |
| `/auth/logout` | POST | Clear auth cookie |

## Customization

Edit files directly:
- `src/pages/login.astro` - Login page design, OAuth providers
- `src/pages/access-denied.astro` - Access denied page
- `src/middleware.ts` - Auth logic, public routes
