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

- Match pages, one-prediction constraint, cutoff enforcement, and visibility rule.

**Scoring and Result Processing** - COMPLETE

- Deterministic score function and automatic recalculation on finished/corrected results.

## M3: Competition Experience

**Goal:** The group can use the application as its tournament leaderboard.

### Features

**Ranking and Personal Statistics** - COMPLETE

- Ranking table, tie-breakers, current-user highlighting, dashboard statistics, and favorite team preference.

**Administration** - COMPLETE

- Admin match forms, status/result changes, and safe result correction workflow.

## Future Considerations

- Tournament/season selection if the app is reused for later competitions.
- Optional CSV import/export or a match-data provider after manual administration proves burdensome.
- Optional token refresh or near-real-time result display only if the friend group needs it.
