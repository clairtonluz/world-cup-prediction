# Testing Infrastructure

## Current State

- Unit/integration test framework: not configured.
- End-to-end framework: not configured.
- Coverage tooling: not configured.
- Existing tests: none discovered.

## Available Automated Check

- `pnpm lint` runs ESLint with Next.js Core Web Vitals and TypeScript rules.
- `pnpm build` is available as a production compilation check.

## Testing Need Introduced By The App

The point calculation rules and prediction visibility/cutoff rules are business-critical and should not ship without automated tests. The implementation plan adds focused unit tests for scoring, roles, and validation, followed by database-backed tests for prediction cutoff and result recalculation.
