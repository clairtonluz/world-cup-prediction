# Project Structure

**Root:** `/Users/clairtonluz/projects/personal/world-cup-prediction`

## Current Tree

```text
.
|-- app/
|   |-- favicon.ico
|   |-- globals.css
|   |-- layout.tsx
|   `-- page.tsx
|-- public/
|   `-- starter SVG assets
|-- AGENTS.md
|-- eslint.config.mjs
|-- next.config.ts
|-- package.json
|-- pnpm-lock.yaml
|-- pnpm-workspace.yaml
|-- postcss.config.mjs
`-- tsconfig.json
```

## Current Areas

### Application Routes

- **Location:** `app/`
- **Purpose:** App Router UI and route entry points.
- **Key files:** `layout.tsx`, `page.tsx`, `globals.css`.

### Static Assets

- **Location:** `public/`
- **Purpose:** Generated starter images referenced by the home page.

### Tooling

- **Location:** project root.
- **Purpose:** Next.js, TypeScript, Tailwind/PostCSS, pnpm, and ESLint configuration.

## Not Yet Present

There is no `components/`, `lib/`, `actions/`, `prisma/`, generated Prisma client directory, test directory, route handler, environment example, or authentication configuration.
