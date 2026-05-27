# World Cup Predictor V1 Design

**Spec:** `.specs/features/world-cup-predictor/spec.md`
**Status:** Official 2026 schedule and bracket implementation completed; live integration verification pending
**Approach:** One simple Next.js App Router application, one PostgreSQL database, and one existing Keycloak realm.

## Official Tournament Implementation Amendment

This amendment replaces the former manually entered fixture and final-only
scoring assumptions in illustrative sections below.

| Area | Implemented decision |
| --- | --- |
| Official data | Additive migration `20260526000000_official_2026_schedule` statically inserts the 104 FIFA fixtures; migration requires a new/empty `Match` table. |
| Match model | Official match number/FIFA ID, nullable participants, fixed slots, confirmation flag, group/round, venue/city, classified team and prediction reset timestamp are stored on `Match`. |
| Rules | `lib/group-standings.ts` and `lib/bracket.ts` are pure functions; the bracket module embeds FIFA Annexe C's official 495 allocation combinations. |
| Mutations | `updateMatchAction` accepts only result state, validates `ADMIN`, scores live/final predictions and calls future-only propagation inside one serializable transaction. |
| Safety | `lib/bracket-propagation.ts` never updates started/past fixtures or official metadata, and deletes bets only if participants in a future fixture change. |
| Pages | The interface is `pt-BR`; `/grupos` presents group standings/rounds and `/matches` presents a compact full schedule with projected/live indications. |

## Deliverable Map

| Requested Deliverable | Location In This Document |
| --- | --- |
| Project overview and user stories | `PROJECT.md` and `spec.md` |
| Functional requirements | `spec.md` |
| Data model and complete Prisma schema | Data Model |
| Keycloak setup | Keycloak Realm And Client Setup |
| Auth.js integration | Authentication Integration |
| API/Server Actions structure | Server Implementation |
| Folder structure | Target Folder Structure |
| UI structure | Pages And UI |
| TypeScript scoring implementation | Scoring Implementation |
| Validation rules | Validation |
| Role helpers | Authorization Helpers |
| Step-by-step implementation plan | `tasks.md` |
| Future improvements | Future Improvements |

## Design Principles

- Keep all functionality in the existing Next.js application; there is no separate backend.
- Prefer Server Components for reads and Server Actions for form mutations.
- Use small `lib/` server-only modules to keep database access and authorization checks together. This follows Next.js data-security guidance without introducing formal architecture layers.
- Store normalized application data only: users, matches, and one prediction per user/match.
- Compute ranking/statistic aggregates when pages are requested; a friend-group dataset does not require caches or denormalized leaderboard tables.
- Treat every Server Action as a public mutation entry point: validate input and authorize again inside the server-side operation.

## Architecture Overview

```mermaid
flowchart LR
    Browser["Browser: App Router UI"] --> Pages["Server Components and forms"]
    Pages --> Auth["Auth.js session"]
    Auth --> KC["Keycloak OIDC realm"]
    Pages --> Actions["Server Actions"]
    Pages --> Queries["Server-only query functions"]
    Actions --> Guards["Role and ownership guards"]
    Queries --> Guards
    Guards --> Prisma["Prisma Client"]
    Prisma --> PG[("PostgreSQL")]
```

### Critical Result Flow

```mermaid
sequenceDiagram
    actor Admin
    participant Action as setMatchResultAction
    participant Auth as requireAdmin
    participant DB as Prisma transaction
    participant Score as calculatePredictionPoints

    Admin->>Action: Submit FINISHED score
    Action->>Auth: Verify session ADMIN role
    Action->>Action: Zod validate fields
    Action->>DB: Update match to FINISHED
    DB->>Score: Calculate each prediction
    Score-->>DB: Integer points
    DB->>DB: Update predictions
    DB-->>Action: Commit once
    Action-->>Admin: Revalidate match/ranking/me pages
```

## Verified Framework Choices

- The checked-out project uses Next.js `16.2.6`; its bundled documentation requires `proxy.ts` rather than the older `middleware.ts` name and warns that Server Actions require their own authorization checks.
- Auth.js currently documents Next.js integration through `auth.ts`, `app/api/auth/[...nextauth]/route.ts`, the Keycloak callback path `/api/auth/callback/keycloak`, and the `next-auth@beta` package.
- Current Prisma ORM 7 documentation requires the connection URL in `prisma.config.ts`; its default `prisma-client` generator requires an explicit output directory.
- The project already uses Tailwind CSS 4; current shadcn/ui instructions support initializing an existing Tailwind CSS 4 Next.js app with the CLI.

## Target Folder Structure

This stays close to the current root-level `app/` convention and avoids an unnecessary source-tree move.

```text
.
|-- actions/
|   |-- admin-match-actions.ts
|   |-- prediction-actions.ts
|   `-- profile-actions.ts
|-- app/
|   |-- api/auth/[...nextauth]/route.ts
|   |-- admin/matches/
|   |   |-- [id]/edit/page.tsx
|   |   |-- new/page.tsx
|   |   `-- page.tsx
|   |-- login/page.tsx
|   |-- matches/[id]/page.tsx
|   |-- matches/page.tsx
|   |-- me/page.tsx
|   |-- ranking/page.tsx
|   |-- layout.tsx
|   `-- page.tsx
|-- components/
|   |-- admin/match-form.tsx
|   |-- matches/match-card.tsx
|   |-- matches/prediction-form.tsx
|   |-- matches/predictions-table.tsx
|   |-- ranking/ranking-table.tsx
|   |-- shared/app-header.tsx
|   |-- stats/stat-card.tsx
|   `-- ui/                         # shadcn/ui generated components only as needed
|-- generated/prisma/               # generated output, configured by Prisma
|-- lib/
|   |-- data/
|   |   |-- matches.ts
|   |   |-- ranking.ts
|   |   `-- statistics.ts
|   |-- auth-guards.ts
|   |-- authorization.ts
|   |-- db.ts
|   |-- match-rules.ts
|   |-- scoring.ts
|   `-- validation.ts
|-- prisma/
|   |-- migrations/
|   `-- schema.prisma
|-- tests/
|   |-- authorization.test.ts
|   |-- scoring.test.ts
|   `-- validation.test.ts
|-- auth.ts
|-- prisma.config.ts
`-- proxy.ts                       # optional redirects only, never sole authorization
```

## Data Model

### Data Decisions

| Model | Purpose | Important Rules |
| --- | --- | --- |
| `User` | Local participant identity and display/profile preference | `keycloakId` uniquely stores Keycloak `sub`; no role field; email nullable and unique when supplied. |
| `Match` | Admin-managed fixture and finished result | UTC instant in `startsAt`; final scores exist only for `FINISHED`; enum stage/status. |
| `Prediction` | One submitted final-score guess and its last calculated points | Unique `(userId, matchId)`; scores are non-negative integers; points default to zero until scored. |

`favoriteTeam` is the sole addition to the requested basic `User` fields. It is needed to implement the requested statistic honestly and remains a small nullable display preference rather than a new team-management model.

### Complete Prisma ORM 7 Schema

File: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum MatchStage {
  GROUP_STAGE
  ROUND_OF_32
  ROUND_OF_16
  QUARTER_FINALS
  SEMI_FINALS
  THIRD_PLACE_MATCH
  FINAL
}

enum MatchStatus {
  SCHEDULED
  STARTED
  FINISHED
}

model User {
  id           String       @id @default(cuid())
  keycloakId   String       @unique
  name         String
  email        String?      @unique
  image        String?
  favoriteTeam String?
  predictions  Prediction[]
  createdAt    DateTime     @default(now()) @db.Timestamptz(3)
  updatedAt    DateTime     @updatedAt @db.Timestamptz(3)
}

model Match {
  id          String       @id @default(cuid())
  teamA       String
  teamB       String
  stage       MatchStage
  startsAt    DateTime     @db.Timestamptz(3)
  status      MatchStatus  @default(SCHEDULED)
  teamAScore  Int?
  teamBScore  Int?
  predictions Prediction[]
  createdAt   DateTime     @default(now()) @db.Timestamptz(3)
  updatedAt   DateTime     @updatedAt @db.Timestamptz(3)

  @@index([status, startsAt])
  @@index([stage])
}

model Prediction {
  id         String   @id @default(cuid())
  userId     String
  matchId    String
  teamAScore Int
  teamBScore Int
  points     Int      @default(0)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  match      Match    @relation(fields: [matchId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now()) @db.Timestamptz(3)
  updatedAt  DateTime @updatedAt @db.Timestamptz(3)

  @@unique([userId, matchId])
  @@index([matchId])
  @@index([userId])
}
```

### Prisma ORM 7 Connection Configuration

File: `prisma.config.ts`

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

File: `lib/db.ts`

```ts
import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const createClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

## Keycloak Realm And Client Setup

The Keycloak server is assumed to exist. Configuration is performed in its Admin Console; menu wording can vary slightly by Keycloak release.

### 1. Create Realm And Roles

1. Create a realm named `world-cup-predictor`.
2. Under realm roles, create `USER` and `ADMIN` exactly in uppercase.
3. Disable duplicate email addresses in realm login settings because the local optional email column is unique when Keycloak supplies it.
4. Assign `USER` to each participating friend.
5. Assign both `ADMIN` and `USER` to administrators, or rely on the application rule that `ADMIN` also receives user capabilities.

### 2. Create OIDC Client

Use client ID `world-cup-predictor-web`.

| Keycloak Setting | Value |
| --- | --- |
| Client type/protocol | OpenID Connect |
| Client authentication | Enabled; this creates a confidential client secret |
| Standard flow | Enabled |
| Direct access grants | Disabled |
| Implicit flow | Disabled |
| Service account roles | Disabled unless later separately required |
| PKCE method | `S256` if the server exposes the setting for this confidential authorization-code client |

### 3. Configure URLs

| Setting | Development | Production |
| --- | --- | --- |
| Root/Home URL | `http://localhost:3000` | `{{production-url}}` |
| Valid redirect URI | `http://localhost:3000/api/auth/callback/keycloak` | `{{production-url}}/api/auth/callback/keycloak` |
| Valid post logout redirect URI | `http://localhost:3000` | `{{production-url}}` |
| Web origins | `http://localhost:3000` | Exact `{{production-url}}` origin |

Avoid wildcard production redirect URIs or web origins. Keycloak requires a post-logout URI to match the configured valid post-logout URI when it is used.

### 4. Configure Claims And Audience

Ensure these OIDC claims are available:

| Claim | Source/Mapper | Token Use |
| --- | --- | --- |
| `sub` | Standard OIDC subject | Stable database `keycloakId` |
| `name` | Standard profile scope | User display name |
| `email` | Standard email scope | Optional local display/contact value |
| `preferred_username` | Standard profile scope | Name fallback |
| `realm_access.roles` | Built-in realm roles mapper / roles client scope | `USER` and `ADMIN` authorization |

Add an audience mapper that places `world-cup-predictor-web` in the access-token `aud` claim. The Auth.js integration below validates issuer, signature, expiration, and this audience before it reads roles.

Optional avatar support: add or provide the standard `picture` claim if available; otherwise the UI renders initials and `User.image` remains null.

### 5. Obtain Configuration And Verify

1. Copy the client secret from the client Credentials tab.
2. Use issuer `https://{{keycloak-host}}/realms/world-cup-predictor`.
3. Sign in as a `USER`, inspect the issued access token only in a secure development tool, and verify its `aud` includes `world-cup-predictor-web` and `realm_access.roles` includes `USER`.
4. Repeat for an `ADMIN`.
5. Do not commit secrets, exported production realms, or tokens.

## Authentication Integration

### Environment Variables

File: `.env.example` should document placeholders only.

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/world_cup_predictor?schema=public"
AUTH_SECRET="generate-with-authjs-cli"
AUTH_KEYCLOAK_ID="world-cup-predictor-web"
AUTH_KEYCLOAK_SECRET="replace-from-keycloak-client-credentials"
AUTH_KEYCLOAK_ISSUER="https://keycloak.example.com/realms/world-cup-predictor"
```

Only server modules access these values. Do not use `NEXT_PUBLIC_` for database or authentication secrets.

### Auth.js Configuration

The design uses JWT sessions and does not add Auth.js adapter tables. The local `User` is the application participant record; Keycloak remains the login/session identity source. At sign-in, Keycloak roles are extracted only after verifying the access token through the realm JWKS endpoint. The raw access token is not returned to browser session data.

File: `auth.ts`

```ts
import NextAuth, { type DefaultSession } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { db } from "@/lib/db";

export type AppRole = "USER" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      keycloakId: string;
      roles: AppRole[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    keycloakId?: string;
    roles?: AppRole[];
  }
}

const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
const clientId = process.env.AUTH_KEYCLOAK_ID;

if (!issuer || !clientId) {
  throw new Error("Keycloak issuer and client ID are required");
}

const jwks = createRemoteJWKSet(
  new URL(`${issuer}/protocol/openid-connect/certs`),
);

function toApplicationRoles(claim: unknown): AppRole[] {
  if (!claim || typeof claim !== "object") {
    return [];
  }

  const roles = (claim as { roles?: unknown }).roles;
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles.filter(
    (role): role is AppRole => role === "USER" || role === "ADMIN",
  );
}

async function verifyAccessToken(accessToken: string) {
  const { payload } = await jwtVerify(accessToken, jwks, {
    issuer,
    audience: clientId,
  });

  if (!payload.sub) {
    throw new Error("Keycloak access token is missing sub");
  }

  return {
    keycloakId: payload.sub,
    roles: toApplicationRoles(payload.realm_access),
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Keycloak],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        if (!account.access_token || !account.expires_at) {
          throw new Error("Keycloak did not provide an expiring access token");
        }

        const identity = await verifyAccessToken(account.access_token);
        token.keycloakId = identity.keycloakId;
        token.roles = identity.roles;
        await db.user.upsert({
          where: { keycloakId: identity.keycloakId },
          update: {
            name: preferredName,
            email: typeof profile?.email === "string" ? profile.email : null,
            image: typeof profile?.picture === "string" ? profile.picture : null,
          },
          create: {
            keycloakId: identity.keycloakId,
            name: preferredName,
            email: typeof profile?.email === "string" ? profile.email : null,
            image: typeof profile?.picture === "string" ? profile.picture : null,
          },
        });
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.keycloakId === "string") {
        session.user.keycloakId = token.keycloakId;
        session.user.roles = token.roles ?? [];
      }

      return session;
    },
  },
});
```

The application uses its own session maxAge (set to 1 hour) as the authoritative duration. Once signed in, the session remains valid until it expires locally, regardless of the Keycloak access token expiration state. This keeps the authorization flow simple.

File: `app/api/auth/[...nextauth]/route.ts`

```ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

### Optional Proxy

File: `proxy.ts`

```ts
export { auth as proxy } from "@/auth";
```

This may keep session handling/redirect UX consistent with Auth.js guidance, but it is optional. It must not be treated as authorization: page reads and every Server Action still call server-side guards.

## Authorization Helpers

File: `lib/authorization.ts`

```ts
import type { AppRole } from "@/auth";

export interface RoleHolder {
  roles?: readonly AppRole[] | null;
}

export function hasRole(user: RoleHolder | null | undefined, role: AppRole) {
  return user?.roles?.includes(role) ?? false;
}

export function isAdmin(user: RoleHolder | null | undefined) {
  return hasRole(user, "ADMIN");
}

export function isUser(user: RoleHolder | null | undefined) {
  return hasRole(user, "USER") || isAdmin(user);
}
```

File: `lib/auth-guards.ts`

```ts
import "server-only";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdmin, isUser } from "@/lib/authorization";

export class AccessDeniedError extends Error {
  constructor() {
    super("Access denied");
  }
}

export async function requireUser() {
  const session = await auth();

  if (!session?.user || !isUser(session.user)) {
    throw new AccessDeniedError();
  }

  const user = await db.user.findUnique({
    where: { keycloakId: session.user.keycloakId },
  });

  if (!user) {
    throw new AccessDeniedError();
  }

  return { session, user };
}

export async function requireAdmin() {
  const context = await requireUser();

  if (!isAdmin(context.session.user)) {
    throw new AccessDeniedError();
  }

  return context;
}
```

Usage rules:

- An admin page calls `requireAdmin()` before reading page data.
- A user page or its query function calls `requireUser()`.
- Each action repeats its own guard even when its form is rendered only on a guarded page.
- Client Components may use exposed roles for button visibility, but never for authority.

## Match And Visibility Rules

File: `lib/match-rules.ts`

```ts
import type { MatchStatus } from "@/generated/prisma/enums";

interface MatchTiming {
  startsAt: Date;
  status: MatchStatus;
}

export function hasEffectivelyStarted(match: MatchTiming, now = new Date()) {
  return match.status !== "SCHEDULED" || now.getTime() >= match.startsAt.getTime();
}

export function mayEditPrediction(match: MatchTiming, now = new Date()) {
  return !hasEffectivelyStarted(match, now);
}
```

`getMatchDetail()` first calls `requireUser()`. It includes the caller's prediction before effective start; only after effective start does it query public participant display fields with all predictions. The query never returns Keycloak identifiers, emails, tokens, or hidden pre-kickoff scores to the client.

## Scoring Implementation

File: `lib/scoring.ts`

```ts
import type { MatchStage } from "@/generated/prisma/enums";

export const STAGE_POINTS: Record<MatchStage, number> = {
  GROUP_STAGE: 10,
  ROUND_OF_32: 15,
  ROUND_OF_16: 20,
  QUARTER_FINALS: 30,
  SEMI_FINALS: 50,
  THIRD_PLACE_MATCH: 40,
  FINAL: 100,
};

export type ScoringCategory =
  | "EXACT_SCORE"
  | "CORRECT_WINNER_EXACT_WINNER_SCORE"
  | "CORRECT_WINNER_EXACT_LOSER_SCORE"
  | "CORRECT_WINNER_ONLY"
  | "CORRECT_DRAW_ONLY"
  | "WRONG_PREDICTION";

type Score = {
  teamAScore: number;
  teamBScore: number;
};

type FinishedMatch = Score & {
  stage: MatchStage;
};

export type ScoringResult = {
  category: ScoringCategory;
  points: number;
};

type Outcome = "TEAM_A" | "TEAM_B" | "DRAW";

function outcome(score: Score): Outcome {
  if (score.teamAScore === score.teamBScore) {
    return "DRAW";
  }

  return score.teamAScore > score.teamBScore ? "TEAM_A" : "TEAM_B";
}

function percentagePoints(stage: MatchStage, percentage: number) {
  return Math.round(STAGE_POINTS[stage] * percentage);
}

export function calculatePredictionPoints(
  prediction: Score,
  match: FinishedMatch,
): ScoringResult {
  if (
    prediction.teamAScore === match.teamAScore &&
    prediction.teamBScore === match.teamBScore
  ) {
    return { category: "EXACT_SCORE", points: STAGE_POINTS[match.stage] };
  }

  const predictedOutcome = outcome(prediction);
  const actualOutcome = outcome(match);

  if (predictedOutcome !== actualOutcome) {
    return { category: "WRONG_PREDICTION", points: 0 };
  }

  if (actualOutcome === "DRAW") {
    return {
      category: "CORRECT_DRAW_ONLY",
      points: percentagePoints(match.stage, 0.3),
    };
  }

  const winnerScoreMatches =
    actualOutcome === "TEAM_A"
      ? prediction.teamAScore === match.teamAScore
      : prediction.teamBScore === match.teamBScore;
  const loserScoreMatches =
    actualOutcome === "TEAM_A"
      ? prediction.teamBScore === match.teamBScore
      : prediction.teamAScore === match.teamAScore;

  if (winnerScoreMatches) {
    return {
      category: "CORRECT_WINNER_EXACT_WINNER_SCORE",
      points: percentagePoints(match.stage, 0.7),
    };
  }

  if (loserScoreMatches) {
    return {
      category: "CORRECT_WINNER_EXACT_LOSER_SCORE",
      points: percentagePoints(match.stage, 0.5),
    };
  }

  return {
    category: "CORRECT_WINNER_ONLY",
    points: percentagePoints(match.stage, 0.3),
  };
}
```

### Scoring Examples To Test

| Stage | Prediction | Actual | Category | Points |
| --- | --- | --- | --- | ---: |
| Group Stage | `2 x 1` | `2 x 1` | Exact score | 10 |
| Final | `2 x 2` | `2 x 2` | Exact score draw | 100 |
| Final | `2 x 1` | `2 x 0` | Exact winner score | 70 |
| Final | `3 x 1` | `2 x 1` | Exact loser score | 50 |
| Final | `3 x 0` | `2 x 1` | Correct winner only | 30 |
| Round of 32 | `1 x 0` | `1 x 2` | Wrong winner | 0 |
| Round of 32 | `1 x 1` | `2 x 2` | Correct draw only, rounded | 5 |

## Validation

File: `lib/validation.ts`

```ts
import { z } from "zod";

const score = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().min(0).max(99),
);

export const predictionSchema = z.object({
  matchId: z.cuid(),
  teamAScore: score,
  teamBScore: score,
});

export const matchCoreSchema = z
  .object({
    teamA: z.string().trim().min(1).max(80),
    teamB: z.string().trim().min(1).max(80),
    stage: z.enum([
      "GROUP_STAGE",
      "ROUND_OF_32",
      "ROUND_OF_16",
      "QUARTER_FINALS",
      "SEMI_FINALS",
      "THIRD_PLACE_MATCH",
      "FINAL",
    ]),
    startsAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  })
  .refine(
    ({ teamA, teamB }) => teamA.toLocaleLowerCase() !== teamB.toLocaleLowerCase(),
    { message: "Teams must be different", path: ["teamB"] },
  );

export const matchResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.enum(["SCHEDULED", "STARTED"]),
    teamAScore: z.null(),
    teamBScore: z.null(),
  }),
  z.object({
    status: z.literal("FINISHED"),
    teamAScore: score,
    teamBScore: score,
  }),
]);

export const favoriteTeamSchema = z.object({
  favoriteTeam: z.string().trim().min(1).max(80).nullable(),
});
```

Additional mutation validation:

- Prediction and profile actions ignore any submitted `userId`; ownership always comes from `requireUser()`.
- Match IDs must exist before any prediction or result mutation.
- A prediction action calls `mayEditPrediction()` inside the server operation immediately before writing.
- Status transitions accepted in v1 are `SCHEDULED -> STARTED`, `SCHEDULED -> FINISHED`, `STARTED -> FINISHED`, and corrections that remain `FINISHED`. Reopening a match is excluded because it would expose already-visible predictions and undo competition state.
- Admin date input must be converted to an ISO instant with offset before it is submitted; store and compare the resulting UTC instant.

## Server Implementation

### Route Handler Policy

Only Auth.js needs a route handler in v1:

| Route Handler | Purpose | Authorization |
| --- | --- | --- |
| `app/api/auth/[...nextauth]/route.ts` | OIDC login/callback/session/logout operations managed by Auth.js | Auth.js and Keycloak protocol handling |

There is no custom CRUD API. Pages read through server-only query functions; forms mutate through Server Actions.

### Read Functions

| Function | File | Responsibility | Guard |
| --- | --- | --- | --- |
| `listMatches()` | `lib/data/matches.ts` | Upcoming/recent cards with caller's prediction summary | `requireUser()` |
| `getMatchDetail(id)` | `lib/data/matches.ts` | Match detail and visibility-filtered comparison DTO | `requireUser()` |
| `getRanking(currentUserId)` | `lib/data/ranking.ts` | Calculate sorted ranking rows and current user's position | `requireUser()` |
| `getPersonalStatistics(userId)` | `lib/data/statistics.ts` | Calculate dashboard totals and stage performance | `requireUser()` plus own ID only |
| `listAdminMatches()` / `getAdminMatch(id)` | `lib/data/matches.ts` | Admin edit/list data | `requireAdmin()` |

All files import `"server-only"` and select only safe fields needed by UI. Rankings may display `name` and `image`, never `email` or `keycloakId`.

### Server Actions

| Action | File | Behavior | Requirements |
| --- | --- | --- | --- |
| `savePredictionAction` | `actions/prediction-actions.ts` | Validate score and upsert caller's prediction before kickoff | PRED-01 - PRED-04 |
| `updateFavoriteTeamAction` | `actions/profile-actions.ts` | Update caller's optional favorite team | STAT-02 |
| `createMatchAction` | `actions/admin-match-actions.ts` | Admin creates scheduled fixture | ADMIN-01 - ADMIN-02 |
| `updateMatchAction` | `actions/admin-match-actions.ts` | Admin edits unplayed fixture metadata or advances status | ADMIN-01 - ADMIN-02 |
| `setMatchResultAction` | `actions/admin-match-actions.ts` | Admin finishes/corrects a finished match and recalculates all related points transactionally | SCORE-03, ADMIN-03 |

### Prediction Mutation Shape

```ts
"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { mayEditPrediction } from "@/lib/match-rules";
import { predictionSchema } from "@/lib/validation";

export async function savePredictionAction(formData: FormData) {
  const { user } = await requireUser();
  const input = predictionSchema.parse({
    matchId: formData.get("matchId"),
    teamAScore: formData.get("teamAScore"),
    teamBScore: formData.get("teamBScore"),
  });

  await db.$transaction(async (tx) => {
    const match = await tx.match.findUniqueOrThrow({
      where: { id: input.matchId },
      select: { id: true, startsAt: true, status: true },
    });

    if (!mayEditPrediction(match)) {
      throw new Error("Predictions are closed for this match");
    }

    await tx.prediction.upsert({
      where: {
        userId_matchId: { userId: user.id, matchId: match.id },
      },
      update: {
        teamAScore: input.teamAScore,
        teamBScore: input.teamBScore,
      },
      create: {
        userId: user.id,
        matchId: match.id,
        teamAScore: input.teamAScore,
        teamBScore: input.teamBScore,
      },
    });
  });

  revalidatePath(`/matches/${input.matchId}`);
  revalidatePath("/matches");
}
```

In implementation, convert `ZodError`, access denial, and closed-prediction errors to form-safe messages rather than exposing exception internals.

### Transactional Result Recalculation

```ts
await db.$transaction(async (tx) => {
  const match = await tx.match.update({
    where: { id: input.matchId },
    data: {
      status: "FINISHED",
      teamAScore: input.teamAScore,
      teamBScore: input.teamBScore,
    },
  });

  const predictions = await tx.prediction.findMany({
    where: { matchId: match.id },
  });

  for (const prediction of predictions) {
    const result = calculatePredictionPoints(prediction, {
      stage: match.stage,
      teamAScore: match.teamAScore!,
      teamBScore: match.teamBScore!,
    });

    await tx.prediction.update({
      where: { id: prediction.id },
      data: { points: result.points },
    });
  }
});
```

This direct loop is intentionally appropriate for a friend group. It is easy to test and keeps result correction consistent without background work.

### Ranking And Statistics Calculation

- Query predictions joined with `FINISHED` matches and public user display fields.
- Sum persisted `points` for totals.
- Use `calculatePredictionPoints()` again to classify exact/correct-winner counts; the pure function keeps definitions identical to point awarding.
- Sort ranking rows in application code by total points, exact count, correct winner count, case-insensitive name, then user ID.
- For `/me`, calculate accuracy from scored predictions with points greater than zero and group points by stage for best-stage performance.
- Dataset size is bounded by friends multiplied by tournament matches, so this is clearer than stored aggregate tables.

## Pages And UI

### Route Map

| Route | Access | Primary UI |
| --- | --- | --- |
| `/` | Public/session-aware | Public invitation landing page with direct Keycloak sign-in; redirect signed-in authorized users to `/matches` and signed-in unauthorized users to `/login?error=forbidden`. |
| `/login` | Public | App title, short description, “Sign in with Keycloak” button, access-denied/session-expired feedback. |
| `/matches` | `USER` or `ADMIN` | Dashboard cards: My Position, Total Points, Accuracy; upcoming matches; recent predictions; ranking preview. |
| `/matches/[id]` | `USER` or `ADMIN` | Match card, status badge, score/prediction form while open, final result, comparison table when visible. |
| `/ranking` | `USER` or `ADMIN` | Ranking table and “My Position” summary with signed-in row highlighted. |
| `/me` | `USER` or `ADMIN` | Statistics cards/progress bar, favorite-team field, best-stage summary. |
| `/admin/matches` | `ADMIN` | Match administration table and create/edit/result links. |
| `/admin/matches/new` | `ADMIN` | Match creation form. |
| `/admin/matches/[id]/edit` | `ADMIN` | Fixture edit/status/result form and recalculation confirmation copy. |

### Component Choices

Use only required shadcn/ui components: `Button`, `Card`, `Input`, `Label`, `Select`, `Badge`, `Table`, `Progress`, `Alert`, and optionally `Avatar`. This limits generated UI code and makes the screens easy to adapt.

### UX Rules

- Show times formatted in the user's locale while storing UTC instants.
- Disable a prediction form in the UI after kickoff, with text explaining why; server enforcement remains authoritative.
- Before kickoff show “Predictions are hidden until the match starts” instead of an empty comparison table.
- Display initials if `image` is null.
- Use semantic labels, table headers, keyboard-operable inputs/buttons, visible error messages, and sufficient status text beyond color alone.
- Provide empty states when no matches, no scored predictions, or no ranking results exist.

## Testing Strategy

### Automated Minimum

| Test Area | Test Cases |
| --- | --- |
| `scoring.test.ts` | Every score category; home and away winners; exact/non-exact draws; each base point; Round of 32 rounding; wrong outcome. |
| `authorization.test.ts` | `USER`, `ADMIN`, missing role, and `ADMIN` inheriting user capability. |
| `validation.test.ts` | Blank/negative/fraction/too-large scores; identical team names; finished match requires both final scores. |
| Server/data tests | Unique prediction ownership, kickoff rejection, hidden-before-start comparison, transaction recalculation after correction. |

### Manual Integration Verification

1. Configure local Keycloak realm/client/users and PostgreSQL.
2. Sign in as a `USER`; confirm admin URLs/actions reject access.
3. Sign in as `ADMIN`; create a match.
4. Submit predictions as at least two users before kickoff.
5. Set match to `STARTED`; verify predictions become comparable and cannot be edited.
6. Finish it with scores; verify points, ranking, and `/me`.
7. Correct the final score; verify all derived views change consistently.
8. Sign out and confirm protected routes cannot expose data.

## Security And Operational Notes

- Keep `AUTH_SECRET`, the Keycloak client secret, and `DATABASE_URL` in deployment secrets, never tracked files.
- Require HTTPS for production Keycloak issuer, application URLs, cookies, and database TLS as supported by the deployment.
- Configure exact production redirect/logout URLs; do not deploy wildcard OIDC callbacks.
- Roles are not stored locally. A local user record never grants authorization by itself.
- Avoid logging access tokens, ID tokens, client secrets, database URLs, emails, or prediction payloads tied to identifiable users.
- The server validates access-token signature/issuer/audience/expiration at authentication and denies an expired token-derived session. V1 deliberately requires re-login rather than implementing refresh-token storage.
- Back up PostgreSQL before/during the tournament; the database contains the authoritative competition history.

## Assumptions And Trade-Offs

| Assumption/Choice | Consequence |
| --- | --- |
| One World Cup tournament exists in v1. | No tournament table or filtering is needed. |
| Matches are entered manually by an admin. | No fragile external fixtures integration; admin effort is acceptable for one tournament. |
| Final scores refer to the result used for predictions, excluding a separate penalty-shootout prediction type. | Admin must enter the agreed scored result consistently for knockout games. |
| A short Auth.js token-derived session requires re-login after access token expiry. | Simple authorization with a bounded role-change delay; less seamless than refresh tokens. |
| Aggregations run on page reads. | Minimal schema and easy correction logic; appropriate for a small dataset. |

## Future Improvements

- Add refresh-token rotation only if repeated logins are disruptive, with careful Keycloak logout/revocation handling.
- Add tournament selection if the same group reuses the application beyond one competition.
- Add CSV fixture import or an official match provider only if manual fixture administration is no longer practical.
- Add audit history for admin result corrections if disputes require accountability.
- Add Playwright browser tests once the Keycloak test environment is stable.

## Official References Consulted

- Next.js 16 bundled project docs: `node_modules/next/dist/docs/01-app/02-guides/authentication.md`, `data-security.md`, and `01-getting-started/07-mutating-data.md` in this repository.
- [Next.js App Router authentication guide](https://nextjs.org/docs/app/guides/authentication)
- [Next.js App Router data security guide](https://nextjs.org/docs/app/guides/data-security)
- [Auth.js installation for Next.js](https://authjs.dev/getting-started/installation?framework=Next.js)
- [Auth.js Keycloak provider](https://authjs.dev/getting-started/providers/keycloak)
- [Keycloak Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/)
- [Keycloak OpenID Connect endpoints](https://www.keycloak.org/securing-apps/oidc-layers)
- [Prisma PostgreSQL connector documentation](https://docs.prisma.io/docs/v6/orm/overview/databases/postgresql)
- [Prisma ORM generators documentation](https://www.prisma.io/docs/orm/prisma-schema/overview/generators)
- [Zod 4 schema API](https://zod.dev/api)
- [shadcn/ui Next.js installation](https://ui.shadcn.com/docs/installation/next)
