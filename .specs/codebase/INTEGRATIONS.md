# Integrations

## Current Integrations

No runtime integrations exist in the starter codebase. It does not currently connect to a database, identity provider, third-party API, or analytics platform.

## Planned Integrations

| Integration | Purpose | Required Configuration |
| --- | --- | --- |
| Keycloak | OIDC authentication and realm roles | Issuer URL, confidential client ID and secret, realm and role setup |
| PostgreSQL | Persistent users, matches, and predictions | `DATABASE_URL` |
| Prisma ORM | Typed database access and migrations | `prisma/schema.prisma`, `prisma.config.ts`, generated client |

## Boundaries

- Keycloak remains the only authority for `USER` and `ADMIN` roles; the database does not persist application permissions.
- PostgreSQL stores the Keycloak subject identifier on the local user record for prediction ownership and display data.
- No real-time feed, message queue, cache, external match provider, or notification integration belongs in v1.
