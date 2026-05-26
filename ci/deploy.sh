#!/bin/sh

set -eu

exec ssh oracle-luz 'sh -eu' <<'REMOTE_COMMANDS'
cd /home/opc/world-cup-prediction

git pull --ff-only

if [ ! -f .env ]; then
  printf 'Production environment file not found: %s\n' /home/opc/world-cup-prediction/.env >&2
  exit 1
fi

compose() {
  docker compose \
    -f compose.yaml \
    -f compose.production.yaml \
    --env-file .env \
    "$@"
}

if ! compose up -d --build --remove-orphans; then
  printf '\nMigration service logs after failed deployment:\n' >&2
  compose logs --no-color migrate >&2 || true
  exit 1
fi
REMOTE_COMMANDS
