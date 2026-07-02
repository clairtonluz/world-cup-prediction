#!/bin/sh

# This script creates a production database backup, copies it locally,
# and restores it into the local Docker Compose database.

set -eu

REMOTE_HOST="oracle-luz"
REMOTE_DIR="/home/opc/world-cup-prediction"
BACKUP_DIR="backups"

timestamp="$(date +%Y%m%d-%H%M%S)"
backup_file="world-cup-prediction-remote-$timestamp.dump"
remote_backup_path="$BACKUP_DIR/$backup_file"
local_backup_path="$BACKUP_DIR/$backup_file"

PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$PROJECT_ROOT"

umask 077
mkdir -p "$BACKUP_DIR"

if [ -e "$local_backup_path" ]; then
  printf >&2 'Local backup file already exists: %s\n' "$local_backup_path"
  exit 1
fi

confirm_restore() {
  printf '\nThis will replace your local database with a backup from %s.\n' "$REMOTE_HOST"
  printf 'Local app and sync-worker services will be stopped and left stopped.\n'
  printf 'Remote backup: %s:%s/%s\n' "$REMOTE_HOST" "$REMOTE_DIR" "$remote_backup_path"
  printf 'Local backup: %s/%s\n' "$PROJECT_ROOT" "$local_backup_path"
  printf 'Type "yes" to continue: '

  if ! IFS= read -r answer; then
    printf >&2 '\nRestore canceled: confirmation was not provided.\n'
    exit 1
  fi

  if [ "$answer" != "yes" ]; then
    printf 'Restore canceled.\n'
    exit 1
  fi
}

printf 'Creating remote database backup on %s...\n' "$REMOTE_HOST"
ssh "$REMOTE_HOST" "cd '$REMOTE_DIR' && COMPOSE_FILE=compose.yaml:compose.production.yaml sh scripts/database/backup.sh -- '$remote_backup_path'"

temp_file="$(mktemp "$BACKUP_DIR/.remote-database-backup.XXXXXX")"

cleanup() {
  rm -f "$temp_file"
}
trap cleanup EXIT HUP INT TERM

printf 'Copying remote backup to %s...\n' "$local_backup_path"
scp "$REMOTE_HOST:$REMOTE_DIR/$remote_backup_path" "$temp_file"
chmod 600 "$temp_file"
mv "$temp_file" "$local_backup_path"
trap - EXIT HUP INT TERM

printf 'Remote backup copied to %s\n' "$local_backup_path"

confirm_restore

printf 'Stopping local app and sync-worker services...\n'
docker compose stop app sync-worker

printf 'Restoring local database from %s...\n' "$local_backup_path"
CONFIRM_RESTORE=yes sh scripts/database/restore.sh -- "$local_backup_path"

printf 'Local database restored from %s\n' "$local_backup_path"
printf 'Local app and sync-worker services remain stopped. Start them with: docker compose up -d app sync-worker\n'
