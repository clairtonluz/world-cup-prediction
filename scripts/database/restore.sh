#!/usr/bin/env sh
set -eu

if [ "$#" -ne 1 ]; then
  printf >&2 'Usage: CONFIRM_RESTORE=yes pnpm db:restore -- backups/world-cup-prediction-YYYYMMDD-HHMMSS.dump\n'
  exit 64
fi

backup_file="$1"

if [ ! -r "$backup_file" ]; then
  printf >&2 'Backup file does not exist or is not readable: %s\n' "$backup_file"
  exit 1
fi

if [ "${CONFIRM_RESTORE:-}" != "yes" ]; then
  printf >&2 'Restore replaces database objects. Re-run with CONFIRM_RESTORE=yes when you are sure.\n'
  exit 1
fi

docker compose exec -T database sh -eu -c '
  : "${POSTGRES_USER:?POSTGRES_USER is required}"
  : "${POSTGRES_DB:?POSTGRES_DB is required}"

  pg_restore \
    --clean \
    --if-exists \
    --exit-on-error \
    --single-transaction \
    --no-owner \
    --no-privileges \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB"
' < "$backup_file"

printf 'Database restored from %s\n' "$backup_file"
