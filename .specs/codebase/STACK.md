# Tech Stack

**Analyzed:** 2026-05-25
**Basis:** `package.json`, `pnpm-lock.yaml`, configuration files, and the starter `app/` directory.

## Installed Core

- Framework: Next.js `16.2.6` using the App Router
- UI runtime: React `19.2.4`, React DOM `19.2.4`
- Language: TypeScript `5.9.3` in strict mode
- Styling: Tailwind CSS `4.3.0` through `@tailwindcss/postcss`
- Linting: ESLint `9.39.4` with `eslint-config-next` `16.2.6`
- Package manager: pnpm, evidenced by `pnpm-lock.yaml` and `pnpm-workspace.yaml`

## Installed Application Capability

- Public starter route at `/` only.
- Root layout, global CSS, fonts, static starter images, and favicon.
- No authentication, persistence, feature UI, validation, or test framework is present.

## Planned Dependencies For This Specification

The following are required by the product specification but are not installed yet:

- Authentication: Auth.js / NextAuth with the Keycloak provider
- Authentication token validation: `jose`
- Database: PostgreSQL
- ORM: Prisma ORM 7 with the PostgreSQL driver adapter
- Validation: Zod
- UI components: shadcn/ui on the existing Tailwind CSS 4 setup
- Tests: Vitest for business rules and server utilities

## Reference Constraints

- The checked-in `AGENTS.md` requires reading the installed Next.js documentation before using Next.js APIs.
- Local Next.js 16 documentation confirms `proxy.ts` replaces `middleware.ts`, Server Actions must perform their own authorization checks, and server-only data access modules with minimal DTOs are the recommended new-project approach.
