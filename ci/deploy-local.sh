#!/bin/sh

# This script performs a deployment from the current project folder.
# It ensures the code is up to date and then runs docker compose.

set -eu

DEPLOY_BRANCH=main

# Navigate to the project root (assuming script is in ci/)
PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$PROJECT_ROOT"

# Only perform git operations if we are in a git repository
if [ -d .git ]; then
    if [ -n "$(git status --porcelain --untracked-files=all)" ]; then
      printf 'Checkout contains local changes; refusing to build an unverified revision:\n' >&2
      git status --short --untracked-files=all >&2
      exit 1
    fi

    printf 'Updating code from origin/%s...\n' "$DEPLOY_BRANCH"
    git fetch origin "$DEPLOY_BRANCH"
    git switch "$DEPLOY_BRANCH"
    git merge --ff-only "origin/$DEPLOY_BRANCH"
    DEPLOY_REVISION=$(git rev-parse --short HEAD)
else
    DEPLOY_REVISION="untracked"
fi

printf 'Deploying revision %s\n' "$DEPLOY_REVISION"

if [ ! -f .env ]; then
  printf 'Environment file .env not found in %s\n' "$PROJECT_ROOT" >&2
  exit 1
fi

compose() {
  docker compose \
    -f compose.yaml \
    -f compose.production.yaml \
    --env-file .env \
    "$@"
}

printf 'Starting docker containers...\n'
if ! compose up -d --build --remove-orphans; then
  printf '\nMigration service logs after failed deployment:\n' >&2
  compose logs --no-color migrate >&2 || true
  exit 1
fi

compose ps app
printf 'Successfully deployed revision %s\n' "$DEPLOY_REVISION"
