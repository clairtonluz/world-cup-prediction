#!/bin/sh

set -eu

exec ssh oracle-luz 'sh -eu' <<'REMOTE_COMMANDS'
cd /home/opc/world-cup-prediction

DEPLOY_BRANCH=main

if [ -n "$(git status --porcelain --untracked-files=all)" ]; then
  printf 'Production checkout contains local changes; refusing to build an unverified revision:\n' >&2
  git status --short --untracked-files=all >&2
  exit 1
fi

git fetch origin "$DEPLOY_BRANCH"
git switch "$DEPLOY_BRANCH"
git merge --ff-only "origin/$DEPLOY_BRANCH"

DEPLOY_REVISION=$(git rev-parse --short HEAD)
printf 'Deploying revision %s from origin/%s\n' "$DEPLOY_REVISION" "$DEPLOY_BRANCH"

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

compose ps app
printf 'Deployed revision %s\n' "$DEPLOY_REVISION"
REMOTE_COMMANDS
