#!/bin/sh

set -eu

SCRIPT_DIRECTORY=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIRECTORY=$(CDPATH= cd -- "$SCRIPT_DIRECTORY/.." && pwd)
ENV_FILE=${ENV_FILE:-"$PROJECT_DIRECTORY/.env.prod"}

if [ ! -f "$ENV_FILE" ]; then
  printf 'Production environment file not found: %s\n' "$ENV_FILE" >&2
  exit 1
fi

cd "$PROJECT_DIRECTORY"

exec docker compose \
  -f compose.yaml \
  -f compose.production.yaml \
  --env-file "$ENV_FILE" \
  up -d --build --remove-orphans
