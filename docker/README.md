# PocketBase Auth - Docker Service

Complete Astro app with Dockerfile. Use as a standalone auth service in your Docker Compose / Coolify stack.

## Quick Start

```bash
npx giget gh:levino/pocketbase-auth/templates/astro-docker apps/auth
cd apps/auth
npm install
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POCKETBASE_URL` | Yes | PocketBase instance URL |
| `POCKETBASE_GROUP` | No | Group field for access control |

## Routes

Everything under `/public/` is accessible without authentication:

| Route | Description |
|-------|-------------|
| `/public/login` | Login page |
| `/public/access-denied` | Not-in-group page |
| `/public/auth/verify` | ForwardAuth endpoint (200/401/403) |
| `/public/auth/cookie` | Set auth cookie |
| `/public/auth/logout` | Clear auth cookie |
| `/*` | Protected (requires authentication) |

## Customization

Edit `src/pages/` directly. Change language, styling, OAuth providers. The code is yours.
