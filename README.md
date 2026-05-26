# Bolão da Copa do Mundo 2026

Aplicação privada e simples para apostas de placares da Copa do Mundo 2026, construída com Next.js App Router, PostgreSQL, Prisma, Keycloak, Tailwind CSS e componentes no estilo shadcn/ui.

## Funcionalidades

- Agenda oficial fixa com os 104 jogos publicados pela FIFA, horários de Brasília, estádios e cidades.
- Página de grupos com classificação projetada durante jogos ao vivo.
- Chaveamento automático: resultados atualizam somente participantes de jogos futuros ainda não iniciados.
- Pontuação provisória durante jogos ao vivo e definitiva ao encerrar o jogo.
- Ranking global, Grupos de Amigos privados e estatísticas pessoais em português do Brasil.
- Convites de Grupos de Amigos por link privado reutilizável; somente o hash do convite é armazenado.
- Administração restrita a status, placares e classificado em empate eliminatório.

## Local Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env` from `.env.example` and set the PostgreSQL and Keycloak values. The application and Prisma automatically derive their PostgreSQL connection URL from `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_PORT`; passwords may contain reserved URL characters. When running Next.js directly with `pnpm dev`, escape a literal `$` in `.env` as `\$`, following Next.js environment-variable expansion rules.

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

Docker Compose builds the standalone production Next.js server and PostgreSQL. Keycloak remains an external dependency. When Keycloak is hosted locally, set `AUTH_KEYCLOAK_ISSUER` to a hostname that is reachable from both the browser and the application container, rather than a container-local `localhost` address.

### Local Container Run

For local runs, Docker Compose automatically merges `compose.override.yaml`, which publishes the application and PostgreSQL on loopback addresses and persists database data in a Docker volume.

1. Create `.env` from `.env.example` and replace the database password, `AUTH_SECRET`, and Keycloak client values. The containers derive their internal connection URL from the `POSTGRES_*` values and safely encode reserved characters in the password. Keep secrets single-quoted in `.env` so a `$` remains literal when Docker Compose reads it.

2. Configure Keycloak redirect and logout URLs for `http://localhost:3000`, as described below.

3. Build and start the database, migration job, and application:

   ```bash
   docker compose up --build
   ```

The app is available at [http://localhost:3000](http://localhost:3000). PostgreSQL is bound to `127.0.0.1:5432` for local administration and is not published on external interfaces. On startup, the `migrate` service applies committed Prisma migrations before the app starts.

Use local `pnpm dev` for day-to-day development; the Docker app runs an optimized production build.

### Production Deployment

`compose.production.yaml` adds the production-only configuration used on a single server behind Traefik: TLS routing through the external `proxy` network, no published application or database ports, a persistent database directory, a container health check, and resource limits. This repository does not currently publish a runtime image, so production builds the checked-out application revision on the server. Use the explicit `-f` command below so the local-only `compose.override.yaml` is not loaded in production.

1. In `/home/opc/world-cup-prediction` on the production server, create an untracked `.env` from `.env.example`. Replace every placeholder secret and set production values, including:

   ```dotenv
   WORLD_CUP_HOST="copa.example.com"
   AUTH_URL="https://copa.example.com"
   POSTGRES_DATA_PATH="./data"
   TZ="America/Fortaleza"
   ```

   No connection URL needs to be stored for the Docker deployment. The application and migration containers use the `database` service internally and build their URL from `POSTGRES_*`.

2. On the production server, ensure Traefik is already running on the shared `proxy` network, and create the database data directory:

   ```bash
   docker network create proxy
   mkdir -p ./data
   ```

   Create the `proxy` network only once; omit that command when the network already exists.

3. From a machine configured with the `oracle-luz` SSH host, deploy the application:

   ```bash
   ./ci/deploy.sh
   ```

The script connects with `ssh oracle-luz`, enters `/home/opc/world-cup-prediction`, refuses non-ignored local changes, fast-forwards the production checkout to `origin/main`, and executes `docker compose -f compose.yaml -f compose.production.yaml --env-file .env up -d --build --remove-orphans` on the server. Ignored production files such as `.env` and `data/` remain available. It prints the deployed Git revision and application container status so the running release can be checked from the deploy log. Traefik serves `https://${WORLD_CUP_HOST}` and forwards requests to the internal application port. PostgreSQL remains on the internal application network; it is not exposed on the host in production. The migration job completes before the application is started.

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

8. Keep the standard OpenID Connect ID token enabled. Logout uses it as Keycloak's
   `id_token_hint` so clicking `Sair` closes the Keycloak SSO session without a
   confirmation prompt.
9. Ensure access tokens expose `sub`, `name`, `email`, `preferred_username`, and `realm_access.roles`.
10. Add an audience mapper so access tokens include `world-cup-predictor-web` in `aud`.
11. Copy the client secret and realm issuer into `.env`.

Roles are validated from the verified Keycloak access token and are never stored as local application permissions.

## Commands

```bash
pnpm test
pnpm lint
pnpm build
pnpm db:deploy
pnpm exec prisma validate
```

`DATABASE_URL` remains supported as an optional override for an external or managed PostgreSQL endpoint.

## Important Rules

- Users can submit one score prediction per match and revise it only before kickoff.
- Knockout predictions open only after both teams are confirmed.
- Other users' predictions remain hidden until kickoff.
- Qualquer participante pode criar Grupos de Amigos privados; membros e administradores autorizados visualizam o ranking do Grupo de Amigos.
- O ranking do Grupo de Amigos usa os pontos totais atuais dos seus membros, inclusive pontos obtidos antes da entrada.
- O criador ou um administrador gerencia convites e membros; remover um membro desativa o convite compartilhado anteriormente.
- An administrator updates live/final scores; any correction recalculates points and future bracket participants transactionally.
- Automatic propagation never changes an already started/past match or the official schedule/location.
- Scoring, group standings, official third-place allocation and bracket rules are covered by unit tests in `tests/`.
