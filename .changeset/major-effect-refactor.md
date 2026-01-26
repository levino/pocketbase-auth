---
"@levino/pocketbase-auth": major
---

BREAKING CHANGE: Refactor auth system to use Effect for typed error handling

This is a breaking change that removes the legacy Promise-based API in favor of Effect-based ROP (Railway-Oriented Programming).

**Breaking Changes:**
- Removed `verifyAuthLegacy()` - use `verifyAuth()` with `Effect.runPromise()` or `Effect.runPromiseExit()` instead
- Removed `handleCookieRequestLegacy()` - use `handleCookieRequest()` with `Effect.runPromise()` or `Effect.runPromiseExit()` instead
- Removed `LegacyAuthResult` interface
- `verifyAuth()` now returns `Effect<AuthResult, AuthError>` instead of `Promise<LegacyAuthResult>`
- `handleCookieRequest()` now returns `Effect<Response, RequestError>` instead of `Promise<Response>`

**Migration Guide:**

Before (legacy API):
```typescript
const result = await verifyAuth(request, options);
if (result.isAuthorized) {
  // User is authorized
}
```

After (Effect API):
```typescript
import { Effect } from "effect";

const exit = await Effect.runPromiseExit(verifyAuth(request, options));
if (exit._tag === "Success") {
  // User is authorized
  const user = exit.value.user;
}
```

**Benefits:**
- Typed error handling with exhaustive pattern matching
- Composable error pipelines
- Better error context preservation
- Railway-Oriented Programming for cleaner control flow
