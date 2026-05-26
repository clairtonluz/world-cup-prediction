# State

**Last Updated:** 2026-05-25
**Current Work:** World Cup Predictor - official 2026 schedule/bracket implemented, integration verification pending

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

### AD-004: Persist the official FIFA 2026 schedule statically (2026-05-25)

**Decision:** Seed the 104 official fixtures in an additive migration, including fixed kickoff/location and bracket-slot data.
**Reason:** The app should display the complete official tournament without any runtime dependency on the FIFA website.
**Trade-off:** The migration intentionally requires a new database with no existing match records.
**Impact:** Administrators manage results only; fixed official fixture metadata is not editable in the UI.

### AD-005: Propagate bracket participants inside result updates (2026-05-25)

**Decision:** Live/final score updates recalculate points and update only future scheduled participant assignments in the same serializable transaction.
**Reason:** The friend group needs immediate projected standings without queues, sockets, or synchronization services.
**Trade-off:** A downstream match already started or past its kickoff is reported but never automatically overwritten.
**Impact:** Changed future participant assignments delete obsolete predictions and surface a request to bet again.

## Active Blockers

### B-001: Live authentication and database flows are not configured

**Discovered:** 2026-05-25
**Impact:** The implementation builds and pure rules are tested, but sign-in, database migration, protected routes, and end-to-end participant/admin workflows cannot be exercised without PostgreSQL and Keycloak environment values.
**Workaround:** Use `.env.example` and the Keycloak instructions in `README.md` to configure a local environment.
**Resolution:** Configure the realm/client/database, run the migration, then execute USER and ADMIN workflow verification.

### B-002: In-app browser blocks local loopback smoke-test URLs

**Discovered:** 2026-05-25
**Impact:** Rendered UI smoke verification could not be captured through the required browser surface.
**Workaround:** The Next.js production build verifies route compilation.
**Resolution:** Retry visual smoke tests when local browser navigation is permitted.

## Deferred Ideas

- [ ] Token refresh and immediate role-change propagation if sessions need to last beyond a short access-token lifetime.
- [ ] Support more than one tournament only after reuse is requested.

## Todos

- [ ] Apply the official migration to clean PostgreSQL, configure Keycloak locally, and run the documented end-to-end verification.

## Preferences

**Model Guidance Shown:** never
