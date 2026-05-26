#!/bin/sh

set -eu

exec ssh oracle-luz 'sh -eu' <<'REMOTE_COMMANDS'
cd /home/opc/world-cup-prediction

git pull --ff-only

if [ ! -f .env ]; then
  printf 'Production environment file not found: %s\n' /home/opc/world-cup-prediction/.env >&2
  exit 1
fi

docker compose \
  -f compose.yaml \
  -f compose.production.yaml \
  --env-file .env \
  up -d --build --remove-orphans
REMOTE_COMMANDS
