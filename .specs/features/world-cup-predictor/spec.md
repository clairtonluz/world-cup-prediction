# World Cup Predictor V1 Specification

**Status:** Official 2026 schedule and bracket implementation completed; integration verification pending
**Scope:** Large feature / complete v1 application
**Project:** `.specs/project/PROJECT.md`

## Problem Statement

A small group of friends needs one reliable place to submit World Cup score predictions and compare results. The application must prevent late changes, score every prediction consistently, display the official 2026 tournament schedule, and let a trusted administrator update results without building a complex competition platform.

## Official 2026 Tournament Amendment

This section supersedes any earlier wording below that describes manually created
fixtures or scoring only after `FINISHED`.

- The committed migration imports the 104 official FIFA fixtures as a static,
  fixed schedule: `72 / 16 / 8 / 4 / 2 / 1 / 1` by stage.
- `Match` stores official match number/FIFA ID, venue/city, optional current
  participants, fixed bracket slots, group/round metadata, confirmed-participant
  state, classified knockout team, and an optional prediction-reset marker.
- No FIFA retrieval occurs at runtime. Dates, kickoff times, stage, venue, city,
  official number and slots are never changed automatically.
- Admin mutations set only status, live/final score and, for a tied completed
  knockout match, the classified team.
- A scored `STARTED` match awards provisional points and influences provisional
  group/ranking views. `FINISHED` makes those values definitive.
- Pure rule modules calculate group tables, rank the eight best third-placed
  teams, apply FIFA Regulations Annexe C allocation, and resolve winner/runner-up
  bracket slots.
- Result updates propagate participant changes only to future `SCHEDULED`
  fixtures. Changed participants invalidate existing bets for that future
  fixture and show that a new bet is required.
- Betting is available only before kickoff and only when both fixture
  participants are confirmed.
- Each participant may optionally select a tournament champion before the
  effective start of match 1, restricted to teams in the fixed group-stage
  schedule. A correct champion adds 200 points after the final is finished.
- Predictions from the round of 32 through the semifinals include the team
  expected to advance; the final and third-place match do not count toward
  this tie-break metric.
- Rankings sort by total points including the champion bonus, exact scores,
  correct outcomes including draws, correct advancing teams and correct
  champion. Remaining ties display the same position.
- Visible application text and match dates operate in `pt-BR` and
  `America/Sao_Paulo`; `/grupos` shows groups, standings and match rounds.

## Goals

- [ ] An authenticated authorized user can make exactly one editable score prediction per match until the effective start time.
- [ ] Finished matches award deterministic integer points using the supplied scoring policy.
- [ ] The ranking, comparison view, and personal statistics expose the competition outcome clearly.
- [ ] An `ADMIN` can manage matches and trigger safe automatic point recalculation through normal UI actions.

## Out Of Scope

| Feature | Reason |
| --- | --- |
| Registration, password reset, or local roles | Keycloak owns identity and realm roles. |
| Friend groups, invitations, multiple tournaments, or prizes | Not needed for the initial friend group. |
| Live feeds, Redis, queues, WebSockets, notifications | Manual administration and page refresh are sufficient for v1. |
| Complete pre-tournament bracket predictions or penalty shootout score guesses | Per-match knockout advancement and one champion pick keep the competition simple. |
| Clean Architecture, DDD, microservices, or event workflows | They add cost without improving this application. |

## Actors And Permissions

The application obtains roles exclusively from the Keycloak access-token claim `realm_access.roles`. `ADMIN` includes all `USER` capabilities; roles are not stored in PostgreSQL.

| Capability | `USER` | `ADMIN` |
| --- | ---: | ---: |
| Sign in/out | Yes | Yes |
| View matches, rankings, own statistics | Yes | Yes |
| Create/update own prediction before kickoff | Yes | Yes |
| Compare visible predictions after kickoff | Yes | Yes |
| Create/edit matches | No | Yes |
| Set match status and final results | No | Yes |
| Trigger point recalculation through result update | No | Yes |

An authenticated Keycloak user without either application role receives access denied for protected product pages and actions.

## Business Definitions

| Term | Definition |
| --- | --- |
| Effective start | A match has started when `status` is `STARTED` or `FINISHED`, or server time is greater than or equal to `startsAt`. This prevents late predictions when an admin has not changed status promptly. |
| Editable prediction | A prediction for which effective start is false. Each user may have at most one prediction for a match. |
| Visible comparison prediction | Before effective start, only the owner may read their predicted score. At or after effective start, authorized users may view all predictions for the match. |
| Scored prediction | A prediction attached to a `FINISHED` match with both final scores recorded. |
| Point rounding | Fractional rewards are rounded to the nearest integer using `Math.round`; for example, 70% of 15 is 11 and 30% of 15 is 5. |
| Exact prediction | Both predicted team scores equal the final team scores, including an exact draw. |
| Correct result count | Count of predictions whose win, loss or draw outcome matches the recorded match outcome. |
| Predicted champion | Optional pre-tournament selection from the scheduled group-stage teams; editable only before the effective start of the first match and worth 200 points after a correct completed final. |
| Accuracy | `predictionsWithPointsGreaterThanZero / scoredPredictions * 100`, displayed as a percentage; zero scored predictions displays `0%`. |
| Favorite team | Optional value selected by the user on `/me`; it is not inferred from predictions. |
| Best stage performance | Stage with the greatest total awarded points for the user; ties use greatest awarded-to-available percentage and then earlier tournament order. |

## User Stories

### P1: Authenticate With Keycloak

**User Story:** As a friend, I want to sign in with the existing Keycloak identity provider so that I can participate without another account.

**Acceptance Criteria:**

1. WHEN a visitor opens `/login` and chooses sign-in THEN the application SHALL use the Keycloak Authorization Code Flow callback at `/api/auth/callback/keycloak`. (`AUTH-01`)
2. WHEN a valid Keycloak login completes THEN the application SHALL upsert a local user using the token `sub` as unique `keycloakId` and SHALL not store realm roles in the database. (`AUTH-02`)
3. WHEN a protected page or mutation is requested THEN the server SHALL require an active Auth.js session whose verified Keycloak roles include `USER` or `ADMIN`. (`AUTH-03`)
4. WHEN a user without an application role signs in THEN the application SHALL deny protected product functionality without granting a local permission. (`AUTH-04`)

**Independent Test:** Configure a Keycloak test user with `USER`, sign in through `/login`, verify a local `User.keycloakId` exists, then repeat with a no-role user and confirm access is denied.

### P1: Browse Matches And Submit Predictions

**User Story:** As a participant, I want to view matches and submit my score before kickoff so that I can enter the competition.

**Acceptance Criteria:**

1. WHEN an authorized user opens `/matches` or `/matches/[id]` THEN the application SHALL display teams, start date/time, stage, status, and final score only when available. (`MATCH-01`)
2. WHEN a user submits non-negative integer scores within the permitted range before effective start THEN the application SHALL create or update that user's sole prediction for the match. (`PRED-02`, `PRED-04`)
3. WHEN server time has reached kickoff or status has left `SCHEDULED` THEN any attempted prediction write SHALL fail without changing stored scores. (`PRED-03`)
4. WHEN the same user submits again before kickoff THEN the application SHALL update the existing prediction rather than create a duplicate. (`PRED-01`, `PRED-02`)

**Independent Test:** Create a scheduled match, save and revise one prediction as a `USER`, then mark/start the match and confirm a subsequent revision is rejected.

### P1: Score Results And View Ranking

**User Story:** As a participant, I want points and standings calculated from final results so that the competition is transparent.

**Acceptance Criteria:**

1. WHEN a match is changed to `FINISHED` with a final score THEN the application SHALL recalculate integer points for every prediction of that match using the documented stage base and score categories. (`SCORE-01`, `SCORE-02`, `SCORE-03`)
2. WHEN an exact draw is predicted THEN the application SHALL award the full stage value, not draw-only points. (`SCORE-02`)
3. WHEN a user opens `/ranking` THEN rows SHALL sort by total points including any champion bonus, exact prediction count, correct result count, correct advancing-team count, and correct champion; fully tied users SHALL share a position. (`RANK-01`)
4. WHEN the signed-in user views ranking THEN their row and “My Position” summary SHALL be identifiable. (`RANK-02`)

**Independent Test:** Seed finished matches and predictions representing every score category, recalculate, and verify points and sorted positions.

### P1: Manage Matches And Results

**User Story:** As an administrator, I want to maintain fixtures and final scores so that friends can use the app without external automation.

**Acceptance Criteria:**

1. WHEN a session with `ADMIN` accesses `/admin/*` THEN the application SHALL allow match list/create/edit interfaces; a non-admin request SHALL be denied server-side. (`ADMIN-01`)
2. WHEN an administrator creates or edits a match THEN the application SHALL validate distinct team names, stage, start date, status, and permitted final-score combination. (`ADMIN-02`)
3. WHEN an administrator finishes a match or corrects its final score THEN match persistence and prediction point recalculation SHALL complete as one server-side operation. (`ADMIN-03`)

**Independent Test:** Use an admin session to create and finish a match with existing predictions; verify updated points. Attempt the same action with a user session and verify no mutation.

### P1: Compare Predictions After Kickoff

**User Story:** As a participant, I want predictions hidden until kickoff and visible afterward so that submissions are fair and discussion is fun.

**Acceptance Criteria:**

1. WHEN a scheduled match has not effectively started THEN `/matches/[id]` SHALL reveal only the signed-in user's prediction. (`VIS-01`)
2. WHEN a match has effectively started THEN `/matches/[id]` SHALL show participant display identity and predicted scores for all submitted predictions. (`VIS-02`)
3. WHEN a client attempts to request another user's pre-kickoff prediction through any server entry point THEN the server SHALL not return it. (`VIS-03`)

**Independent Test:** Create predictions for two users, read the match detail before and after effective start, and compare returned DTOs.

### P1: Review Personal Statistics

**User Story:** As a participant, I want a personal dashboard so that I can see how well I am doing.

**Acceptance Criteria:**

1. WHEN a user opens `/me` THEN the application SHALL show total points, exact predictions, correct results, correct advancing teams, champion prediction/bonus, total scored/predicted matches, accuracy, favorite team, and best stage performance. (`STAT-01`)
2. WHEN a user has not selected a favorite team or has no scored predictions THEN the UI SHALL show a clear empty state rather than invented statistics. (`STAT-01`, `STAT-03`)
3. WHEN a user selects or updates a favorite team THEN only their own local profile SHALL be updated after server validation. (`STAT-02`)

**Independent Test:** Open `/me` for a user with known scored predictions and a selected favorite team, then compare all displayed statistics to expected aggregation results.

## Functional Requirements

### Authentication And Authorization

| ID | Requirement |
| --- | --- |
| AUTH-01 | Integrate Auth.js / NextAuth with a Keycloak confidential OIDC client using Authorization Code Flow, standard flow enabled, and PKCE `S256` when configurable. |
| AUTH-02 | Sync `sub`, `name`, `email`, and optional picture into a local user record; `keycloakId` is unique. |
| AUTH-03 | Derive roles only from a server-validated access token `realm_access.roles` claim and provide reusable `hasRole()`, `isAdmin()`, and `isUser()` functions. |
| AUTH-04 | Authorize pages, data reads, Server Actions, and the Auth.js route boundary appropriately; frontend role display never substitutes for server checks. |

### Matches And Predictions

| ID | Requirement |
| --- | --- |
| MATCH-01 | Persist and display two teams, stage, UTC-backed start instant, status, and nullable final score. |
| MATCH-02 | Support exactly the seven requested tournament stages and three statuses. |
| PRED-01 | Persist one score pair per `(userId, matchId)` with a database unique constraint. |
| PRED-02 | Permit an authorized user to create or update only their own prediction before effective start. |
| PRED-03 | Reject score mutation at or after effective start using server time and match status. |
| PRED-04 | Validate scores as integer values from `0` through `99`; the upper bound prevents malformed input without limiting realistic results. |
| VIS-01 | Before effective start, return only the requesting user's prediction in match detail data. |
| VIS-02 | After effective start, return all prediction display DTOs for comparison. |
| VIS-03 | Apply visibility logic in server-side data access, not only by conditionally rendering UI. |

### Scoring, Ranking, And Statistics

| ID | Requirement |
| --- | --- |
| SCORE-01 | Store stage base points: group 10, round of 32 15, round of 16 20, quarter finals 30, semi finals 50, third place 40, final 100. |
| SCORE-02 | Award exact score 100%, correct winner plus exact winner score 70%, correct winner plus exact loser score 50%, correct winner only 30%, correct non-exact draw 30%, otherwise 0%, rounded with `Math.round`. |
| SCORE-03 | Set points to zero until a match is finished; recalculate every related prediction if its finished result is inserted or changed. |
| RANK-01 | Aggregate ranking from predictions and finished match results with the specified deterministic tie-breakers. |
| RANK-02 | Display position, public participant name/avatar fallback, total points, exact predictions, correct results, correct advancing teams, eligible champion picks, and highlighted current user row. |
| STAT-01 | Aggregate and show the specified personal statistics using only the user's predictions and finished matches. |
| STAT-02 | Store optional favorite-team preference on the local user rather than infer it. |
| STAT-03 | Define best-stage and accuracy rules consistently with the business definitions above. |

### Administration And User Interface

| ID | Requirement |
| --- | --- |
| ADMIN-01 | Restrict every `/admin/*` page and admin Server Action to token-derived `ADMIN`. |
| ADMIN-02 | Permit admin create/edit/status/result changes with Zod validation and explicit invalid-state messages. |
| ADMIN-03 | Recalculate points in the same database transaction used to finish or correct a result. |
| UI-01 | Implement `/login`, `/matches`, `/matches/[id]`, `/ranking`, `/me`, `/admin/matches`, `/admin/matches/new`, and `/admin/matches/[id]/edit` with accessible forms, tables/cards, status badges, progress indicators, loading/empty/error states, and current-user highlighting. |

## Validation And Edge Cases

- WHEN a score is blank, negative, fractional, non-numeric, or above `99` THEN the server SHALL reject it with field validation errors.
- WHEN an admin sets `FINISHED` without both final scores THEN the server SHALL reject the change.
- WHEN a match is `SCHEDULED` or `STARTED` THEN its final scores SHALL remain null; final scores are recorded only as part of finishing/correcting a finished match.
- WHEN a match final score is corrected THEN all dependent point totals SHALL reflect the correction immediately after the action succeeds.
- WHEN a user's email claim is absent THEN local user synchronization SHALL permit `email = null`; `keycloakId` remains identity authority.
- WHEN two display names are identical in the ranking THEN alphabetical comparison may tie; stable ordering SHALL use user ID as a final implementation-only deterministic order.
- WHEN kickoff occurs while a form is open THEN submission SHALL be rejected by server enforcement even if the client still displays an enabled button.
- WHEN no predictions are scored THEN ranking/statistical counts and points SHALL be zero and accuracy SHALL display `0%`.

## Requirement Traceability

| Requirement IDs | Story | Design Area | Status |
| --- | --- | --- | --- |
| AUTH-01 - AUTH-04 | Authenticate With Keycloak | Authentication and authorization | In Design |
| MATCH-01 - MATCH-02 | Browse Matches | Data model and match reads | In Design |
| PRED-01 - PRED-04 | Submit Predictions | Prediction actions and validation | In Design |
| VIS-01 - VIS-03 | Compare Predictions | Visibility query policy | In Design |
| SCORE-01 - SCORE-03 | Score Results | Scoring function and admin transaction | In Design |
| RANK-01 - RANK-02 | View Ranking | Ranking aggregation and UI | In Design |
| STAT-01 - STAT-03 | Personal Statistics | Statistics query and profile update | In Design |
| ADMIN-01 - ADMIN-03 | Manage Matches | Admin pages/actions | In Design |
| UI-01 | All stories | App Router UI composition | In Design |

**Coverage:** 25 requirements, 25 mapped to design, 0 unmapped.

## Success Criteria

- [ ] A `USER` can sign in, predict, revise before kickoff, and is prevented from revising after kickoff.
- [ ] Automated scoring tests cover all score categories, draw handling, stages that require rounding, and incorrect outcomes.
- [ ] Result correction updates ranking and statistics without manual database intervention.
- [ ] A non-admin cannot read or execute admin functionality even if directly submitting a request.
- [ ] Before-kickoff prediction privacy is enforced in data returned by the server.
