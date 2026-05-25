# State

**Last Updated:** 2026-05-25
**Current Work:** World Cup Predictor - complete v1 specification

## Recent Decisions

### AD-001: Keep a single straightforward Next.js application (2026-05-25)

**Decision:** Build pages, Server Actions, small server-only data helpers, and Prisma storage in one App Router application.
**Reason:** The product serves a small friend group and has simple transactional behavior.
**Trade-off:** There is no generalized service boundary intended for independent deployment or large-scale reuse.
**Impact:** Avoid microservices, events, queues, caching systems, and excessive abstraction.

### AD-002: Keycloak remains authorization authority (2026-05-25)

**Decision:** Read `USER` and `ADMIN` from verified Keycloak `realm_access.roles`; store only the Keycloak user subject and public profile fields locally.
**Reason:** The requested role management already exists in Keycloak and duplicating it creates inconsistency.
**Trade-off:** Role updates apply according to token/session lifetime unless token refresh is later implemented.
**Impact:** Every protected server operation must use token-derived authorization helpers.

### AD-003: Favorite team is an explicit optional profile preference (2026-05-25)

**Decision:** Add optional `favoriteTeam` to the local `User` model and allow the user to set it on `/me`.
**Reason:** Inferring a favorite from predictions is inaccurate when users commonly predict most matches.
**Trade-off:** Adds one small profile mutation not explicitly listed in the initial data fields.
**Impact:** The statistics page can display a meaningful favorite team without a Team table.

## Active Blockers

None. Keycloak deployment details and the production application URL must be supplied during environment setup.

## Deferred Ideas

- [ ] Token refresh and immediate role-change propagation if sessions need to last beyond a short access-token lifetime.
- [ ] Import match fixtures from an external source if manual admin entry becomes inconvenient.
- [ ] Support more than one tournament only after reuse is requested.

## Todos

- [ ] Review and approve the specification before starting M1 implementation.

## Preferences

**Model Guidance Shown:** never
