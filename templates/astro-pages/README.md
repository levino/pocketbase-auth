# PocketBase Auth - Astro Pages

Auth pages and middleware for existing Astro projects.

## Installation

```bash
# Copy into your Astro project
npx giget gh:levino/pocketbase-auth/templates/astro-pages src/auth-pages

# Then move files to correct locations:
mv src/auth-pages/src/middleware.ts src/middleware.ts
mv src/auth-pages/src/pages/* src/pages/
rm -rf src/auth-pages
```

## Setup

1. Add PocketBase SDK:
   ```bash
   npm install pocketbase
   ```

2. Add environment variables to `.env`:
   ```
   POCKETBASE_URL=https://your-pocketbase.example.com
   POCKETBASE_GROUP=members
   ```

3. Configure `astro.config.mjs` for SSR:
   ```js
   export default defineConfig({
     output: "server", // or "hybrid"
   });
   ```

## Files

- `src/middleware.ts` - Auth check for all routes
- `src/pages/login.astro` - Login page with OAuth buttons
- `src/pages/access-denied.astro` - Shown when user is not in group
- `src/pages/auth/verify.ts` - ForwardAuth endpoint (for Traefik/nginx)
- `src/pages/auth/cookie.ts` - Sets HTTP-only auth cookie
- `src/pages/auth/logout.ts` - Clears auth cookie

## Customization

Edit the pages directly to change:
- Language/text
- Styling
- OAuth providers
- Redirect behavior
