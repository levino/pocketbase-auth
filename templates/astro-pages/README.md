# PocketBase Auth - Astro Pages

Auth pages and middleware for existing Astro projects.

## Installation

```bash
npx giget gh:levino/pocketbase-auth/templates/astro-pages ./auth-temp

# Move into your project
mv auth-temp/src/middleware.ts src/middleware.ts
mv auth-temp/src/env.d.ts src/env.d.ts
cp -r auth-temp/src/pages/public src/pages/public
rm -rf auth-temp
```

## Setup

1. Add PocketBase SDK:
   ```bash
   npm install pocketbase
   ```

2. Set environment variables:
   ```
   POCKETBASE_URL=https://your-pocketbase.example.com
   POCKETBASE_GROUP=members  # optional, skip for auth-only
   ```

3. Astro config needs SSR:
   ```js
   export default defineConfig({
     output: "server",
   });
   ```

## Files

| File | Route | Description |
|------|-------|-------------|
| `src/middleware.ts` | - | Auth check for all non-`/auth/` routes |
| `src/pages/auth/login.astro` | `/auth/login` | Login page with OAuth buttons |
| `src/pages/auth/access-denied.astro` | `/auth/access-denied` | Shown when not in group |
| `src/pages/auth/cookie.ts` | `/auth/cookie` | Sets auth cookie |
| `src/pages/auth/logout.ts` | `/auth/logout` | Clears auth cookie |

## Customization

Edit the files directly. They are yours. Change language, styling, providers, whatever you want.
