# Roadmap

**Current Milestone:** Environment integration verification
**Status:** IN PROGRESS

## M0: Complete Specification

**Goal:** Produce an implementable, reviewed plan for the complete v1 application.
**Target:** Specification documents cover requirements, design, security boundaries, data model, code samples, and verified tasks.

### Features

**World Cup Predictor Specification** - COMPLETE

- Define authentication, authorization, match, prediction, score, ranking, statistics, and administration behavior.
- Define the Prisma model, application modules, UI pages, and implementation sequence.
- Identify validation, testing, operational assumptions, and deferred improvements.

## M1: Running Foundation

**Goal:** Authenticated users can open a protected application backed by a migrated database.

### Features

**Database and UI Tooling** - COMPLETE

- Prisma/PostgreSQL setup, migration, generated client, Zod, and shadcn/ui.

**Keycloak Authentication and Roles** - IN PROGRESS

- Auth.js sign-in, user synchronization, and server-side role guards are implemented.
- Realm/client configuration and live sign-in verification require environment credentials.

## M2: Prediction Loop

**Goal:** Friends can view scheduled matches, submit predictions before kickoff, and see scored results.

### Features

**Matches and Predictions** - COMPLETE

- Static official 104-game schedule, match pages, one-prediction constraint, cutoff/confirmation enforcement, and visibility rule.

**Scoring and Result Processing** - COMPLETE

- Deterministic score function with provisional live scoring and automatic recalculation on updated results.

## M3: Competition Experience

**Goal:** The group can use the application as its tournament leaderboard.

### Features

**Ranking and Personal Statistics** - COMPLETE

- Ranking table, tie-breakers, current-user highlighting, dashboard statistics, and favorite team preference.

**Administration** - COMPLETE

- Result-only admin forms, future-only bracket propagation, and safe result correction workflow.

**Groups And Official Bracket** - COMPLETE

- Portuguese group tables, full agenda, official best-third allocation and automatic future participant assignment.

## Future Considerations

- Tournament/season selection if the app is reused for later competitions.
- Optional token refresh or near-real-time result display only if the friend group needs it.
