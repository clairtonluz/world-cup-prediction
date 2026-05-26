# World Cup Predictor

**Vision:** A small private web app where friends submit World Cup score predictions, see points calculated consistently after matches, and compare standings without administrative overhead.
**For:** A small group of friends and one or a few trusted administrators.
**Solves:** Keeping predictions, scoring, and rankings transparent in one shared place instead of spreadsheets or chat messages.

## Goals

- Allow an authenticated friend to create or edit one score prediction per scheduled match until kickoff.
- Calculate points deterministically for every finished predicted match using the documented stage and accuracy rules.
- Show a ranking and personal statistics that can be reproduced from stored predictions and final results.
- Allow an administrator to maintain matches and corrected results without direct database editing.

## Tech Stack

**Installed baseline:**

- Framework: Next.js `16.2.6`, App Router
- UI runtime: React `19.2.4`
- Language: TypeScript `5.9.3`, strict mode
- Styling: Tailwind CSS `4.3.0`

**Planned v1 dependencies:**

- UI components: shadcn/ui
- Authentication: Auth.js / NextAuth with Keycloak OIDC
- Authorization source: Keycloak `realm_access.roles`
- Data: PostgreSQL with Prisma ORM 7
- Validation: Zod
- Focused tests: Vitest

## Scope

**v1 includes:**

- Keycloak sign-in and sign-out with `USER` and `ADMIN` realm roles.
- Match schedule, detail view, prediction entry, and post-kickoff comparison.
- Stage-weighted point calculation, ranking, and personal dashboard statistics.
- Administrator match creation/editing/status/result workflows and automatic point recalculation.

**Explicitly out of scope:**

- Registration/password management inside the application; Keycloak owns identities.
- Local permission or role administration.
- Live match data feeds, WebSockets, push notifications, queues, Redis, and caching infrastructure.
- Private friend groups, multiple tournaments, prizes, social comments, or prediction types beyond final score.
- Clean Architecture, DDD, microservices, event-driven workflows, or generalized framework abstractions.

## Constraints And Decisions

- Delivery is optimized for one developer and a small friend group, not high traffic.
- The application is a single Next.js deployment with one PostgreSQL database and one existing Keycloak server.
- A thin server-only data module is used to keep access control next to database operations; it is not a layered architecture initiative.
- Roles are read from verified Keycloak token claims and are never persisted as local permissions.
- `favoriteTeam` is an optional profile selection because it cannot be meaningfully inferred when users predict every match.
