# Code Conventions

**Observation scope:** The repository contains only the generated Next.js starter application, so these are baseline conventions rather than established feature patterns.

## Naming And Files

- Routes use App Router files such as `app/page.tsx` and `app/layout.tsx`.
- Components are PascalCase functions: `Home`, `RootLayout`.
- Variables and configuration objects are camelCase: `geistSans`, `geistMono`, `nextConfig`.
- Type-only imports use `import type`, as seen for `Metadata` and `NextConfig`.

## Formatting And Type Safety

- Double quotes and semicolons are used in TypeScript files.
- TypeScript is strict and configured with the `@/*` root alias.
- Props are typed inline for the root layout.
- ESLint uses the Next.js Core Web Vitals and TypeScript presets.

## Feature Convention To Adopt

- Continue using App Router colocated route files.
- Put reusable UI in `components/`, server-only data and authorization helpers in `lib/`, and mutations in `actions/`.
- Keep DTOs explicit and avoid passing Prisma records or token values to Client Components.
