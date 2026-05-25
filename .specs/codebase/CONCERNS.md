# Concerns

**Analyzed:** 2026-05-25

## Current Codebase

| Concern | Impact | Mitigation In Plan |
| --- | --- | --- |
| Starter-only codebase has no domain behavior or tests | All product behavior is new and unprotected by tests | Introduce tests alongside scoring and server-side mutation rules |
| Authentication and database dependencies are absent | Feature cannot be built until integrations are configured | Foundation milestone installs/configures them before UI work |
| Next.js 16 has changed framework conventions | Old examples may incorrectly introduce `middleware.ts` or insufficient Server Action authorization | Follow bundled Next.js 16 docs and use `proxy.ts` only as optional redirect optimization |

## Security-sensitive Areas To Verify During Implementation

- Never expose the Keycloak client secret or access token to client components.
- Validate roles server-side from the Keycloak-issued access token; UI visibility is not authorization.
- Enforce prediction cutoff and ownership inside the mutation, not just by disabling form controls.
- Suppress other users' predictions until a match has effectively started.
- Recalculate stored points atomically when an admin corrects a result.
