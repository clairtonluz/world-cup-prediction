# Bolão da Copa do Mundo 2026

Aplicação privada e simples para apostas de placares da Copa do Mundo 2026, construída com Next.js App Router, PostgreSQL, Prisma, Keycloak, Tailwind CSS e componentes no estilo shadcn/ui.

## Funcionalidades

- Agenda oficial fixa com os 104 jogos publicados pela FIFA, horários de Brasília, estádios e cidades.
- Página de grupos com classificação projetada durante jogos ao vivo.
- Chaveamento automático: resultados atualizam somente participantes de jogos futuros ainda não iniciados.
- Pontuação provisória durante jogos ao vivo e definitiva ao encerrar o jogo.
- Ranking e estatísticas pessoais em português do Brasil.
- Administração restrita a status, placares e classificado em empate eliminatório.

## Local Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env` from `.env.example` and set the PostgreSQL and Keycloak values.

3. Create the PostgreSQL database, then generate and migrate Prisma:

   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

   A migração da agenda oficial exige a tabela `Match` vazia, conforme a premissa
   de um banco novo para o torneio. Ela insere exatamente os 104 jogos oficiais;
   não busca dados da FIFA em tempo de execução.

4. Start the app:

   ```bash
   pnpm dev
   ```

## Docker Compose

Docker Compose runs the production Next.js build and PostgreSQL. Keycloak remains an external dependency. When Keycloak is hosted locally, set `AUTH_KEYCLOAK_ISSUER` to a hostname that is reachable from both the browser and the application container, rather than a container-local `localhost` address.

1. Create `.env` from `.env.example` and replace the database password, `AUTH_SECRET`, and Keycloak client values. Keep `POSTGRES_PASSWORD` URL-safe because it is used in the PostgreSQL connection URL.

2. Configure Keycloak redirect and logout URLs for `http://localhost:3000`, as described below.

3. Build and start the database, migration job, and application:

   ```bash
   docker compose up --build
   ```

The app is available at [http://localhost:3000](http://localhost:3000). PostgreSQL is bound to `127.0.0.1:5432` for local administration and is not published on external interfaces. On startup, the `migrate` service applies committed Prisma migrations before the app starts.

Use local `pnpm dev` for day-to-day development; the Docker app runs an optimized production build.

## Keycloak Setup

Configure the existing Keycloak server before signing in:

1. Create realm `world-cup-predictor`.
2. Disable duplicate email addresses in the realm.
3. Create realm roles `USER` and `ADMIN`; assign at least one to each participant.
4. Create an OpenID Connect client named `world-cup-predictor-web`.
5. Enable client authentication and Standard Flow. Disable implicit/direct grant flows unless separately required. Configure PKCE `S256` when exposed for the confidential client.
6. Add valid redirect URIs:

   ```text
   http://localhost:3000/api/auth/callback/keycloak
   {{production-url}}/api/auth/callback/keycloak
   ```

7. Add valid post logout redirect URIs:

   ```text
   http://localhost:3000
   {{production-url}}
   ```

8. Ensure access tokens expose `sub`, `name`, `email`, `preferred_username`, and `realm_access.roles`.
9. Add an audience mapper so access tokens include `world-cup-predictor-web` in `aud`.
10. Copy the client secret and realm issuer into `.env`.

Roles are validated from the verified Keycloak access token and are never stored as local application permissions.

## Commands

```bash
pnpm test
pnpm lint
pnpm build
pnpm db:deploy
DATABASE_URL="postgresql://..." pnpm exec prisma validate
```

## Important Rules

- Users can submit one score prediction per match and revise it only before kickoff.
- Knockout predictions open only after both teams are confirmed.
- Other users' predictions remain hidden until kickoff.
- An administrator updates live/final scores; any correction recalculates points and future bracket participants transactionally.
- Automatic propagation never changes an already started/past match or the official schedule/location.
- Scoring, group standings, official third-place allocation and bracket rules are covered by unit tests in `tests/`.
