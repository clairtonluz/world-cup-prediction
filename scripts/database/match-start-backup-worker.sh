#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-backups}"
BACKUP_PREFIX="world-cup-prediction-match-start"
POSTGRES_HOST="${POSTGRES_HOST:-database}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POLL_INTERVAL_SECONDS="${MATCH_START_BACKUP_POLL_INTERVAL_SECONDS:-60}"
RETENTION="${MATCH_START_BACKUP_RETENTION:-10}"
CURRENT_TEMP_FILE=""

cleanup() {
  if [ -n "$CURRENT_TEMP_FILE" ] && [ -e "$CURRENT_TEMP_FILE" ]; then
    rm -f "$CURRENT_TEMP_FILE"
  fi
}
trap cleanup EXIT HUP INT TERM

require_config() {
  : "${POSTGRES_DB:?POSTGRES_DB is required}"
  : "${POSTGRES_USER:?POSTGRES_USER is required}"
  : "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"

  validate_positive_integer MATCH_START_BACKUP_POLL_INTERVAL_SECONDS "$POLL_INTERVAL_SECONDS"
  validate_positive_integer MATCH_START_BACKUP_RETENTION "$RETENTION"
}

validate_positive_integer() {
  name="$1"
  value="$2"

  case "$value" in
    ''|*[!0-9]*)
      printf >&2 '%s must be a positive integer, got: %s\n' "$name" "$value"
      exit 64
      ;;
  esac

  if [ "$value" -lt 1 ]; then
    printf >&2 '%s must be greater than zero, got: %s\n' "$name" "$value"
    exit 64
  fi
}

run_psql() {
  PGPASSWORD="$POSTGRES_PASSWORD" psql \
    --host "$POSTGRES_HOST" \
    --port "$POSTGRES_PORT" \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB" \
    --no-align \
    --no-psqlrc \
    --quiet \
    --set ON_ERROR_STOP=1 \
    --tuples-only \
    "$@"
}

run_pg_dump() {
  PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    --host "$POSTGRES_HOST" \
    --port "$POSTGRES_PORT" \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB" \
    --format=custom \
    --no-owner \
    --no-privileges
}

wait_for_database() {
  until PGPASSWORD="$POSTGRES_PASSWORD" pg_isready \
    --host "$POSTGRES_HOST" \
    --port "$POSTGRES_PORT" \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB" >/dev/null 2>&1; do
    printf 'Waiting for database before starting match-start backups...\n'
    sleep 2
  done
}

list_pending_matches() {
  run_psql <<'SQL'
SELECT concat_ws('|', m.id, m."matchNumber", m.status)
FROM "Match" m
WHERE m."startsAt" <= now()
  AND m.status <> 'FINISHED'
  AND NOT EXISTS (
    SELECT 1
    FROM "MatchStartBackup" b
    WHERE b."matchId" = m.id
      AND b.status = 'COMPLETED'
  )
ORDER BY m."startsAt" ASC, m."matchNumber" ASC;
SQL
}

reserve_match_backup() {
  match_id="$1"
  match_status="$2"

  run_psql \
    --set "match_id=$match_id" \
    --set "match_status=$match_status" <<'SQL'
INSERT INTO "MatchStartBackup" (
  "matchId",
  "status",
  "matchStatus",
  "createdAt",
  "updatedAt"
)
VALUES (
  :'match_id',
  'IN_PROGRESS',
  :'match_status'::"MatchStatus",
  now(),
  now()
)
ON CONFLICT ("matchId") DO UPDATE
SET
  "fileName" = NULL,
  "status" = 'IN_PROGRESS',
  "matchStatus" = EXCLUDED."matchStatus",
  "lastError" = NULL,
  "updatedAt" = now(),
  "completedAt" = NULL
WHERE "MatchStartBackup"."status" <> 'COMPLETED'
RETURNING "matchId";
SQL
}

record_backup_completion() {
  match_id="$1"
  match_status="$2"
  file_name="$3"

  run_psql \
    --set "match_id=$match_id" \
    --set "match_status=$match_status" \
    --set "file_name=$file_name" <<'SQL'
UPDATE "MatchStartBackup"
SET
  "fileName" = :'file_name',
  "status" = 'COMPLETED',
  "matchStatus" = :'match_status'::"MatchStatus",
  "lastError" = NULL,
  "updatedAt" = now(),
  "completedAt" = now()
WHERE "matchId" = :'match_id'
  AND "status" <> 'COMPLETED'
RETURNING "matchId";
SQL
}

record_backup_failure() {
  match_id="$1"
  message="$2"

  run_psql \
    --set "match_id=$match_id" \
    --set "message=$message" <<'SQL'
UPDATE "MatchStartBackup"
SET
  "status" = 'FAILED',
  "lastError" = left(:'message', 500),
  "updatedAt" = now()
WHERE "matchId" = :'match_id'
  AND "status" <> 'COMPLETED';
SQL
}

create_backup_for_match() {
  match_id="$1"
  match_number="$2"
  match_status="$3"

  if ! reserved_match_id="$(reserve_match_backup "$match_id" "$match_status")"; then
    printf >&2 'Could not reserve match-start backup for match %s.\n' "$match_number"
    return 1
  fi

  if [ -z "$reserved_match_id" ]; then
    printf 'Match %s already has a completed start backup; skipping.\n' "$match_number"
    return 0
  fi

  timestamp="$(date +%Y%m%d-%H%M%S)"
  padded_match_number="$(printf '%03d' "$match_number")"
  file_name="${BACKUP_PREFIX}-${padded_match_number}-${timestamp}.dump"
  output_file="$BACKUP_DIR/$file_name"

  if [ -e "$output_file" ]; then
    record_backup_failure "$match_id" "backup file already exists"
    printf >&2 'Backup file already exists for match %s: %s\n' "$match_number" "$output_file"
    return 1
  fi

  CURRENT_TEMP_FILE="$(mktemp "$BACKUP_DIR/.match-start-backup.XXXXXX")"
  if run_pg_dump > "$CURRENT_TEMP_FILE"; then
    chmod 600 "$CURRENT_TEMP_FILE"
    mv "$CURRENT_TEMP_FILE" "$output_file"
    CURRENT_TEMP_FILE=""
  else
    rm -f "$CURRENT_TEMP_FILE"
    CURRENT_TEMP_FILE=""
    record_backup_failure "$match_id" "pg_dump failed"
    printf >&2 'Database backup failed for match %s.\n' "$match_number"
    return 1
  fi

  if ! completed_match_id="$(record_backup_completion "$match_id" "$match_status" "$file_name")"; then
    printf >&2 'Backup was written but could not be recorded for match %s: %s\n' "$match_number" "$output_file"
    return 1
  fi

  if [ -z "$completed_match_id" ]; then
    rm -f "$output_file"
    printf 'Duplicate match-start backup removed for match %s: %s\n' "$match_number" "$output_file"
    return 0
  fi

  printf 'Match-start backup written for match %s: %s\n' "$match_number" "$output_file"
}

prune_old_backups() {
  if ! old_files="$(run_psql --set "retention=$RETENTION" <<'SQL'
SELECT "fileName"
FROM "MatchStartBackup"
WHERE "status" = 'COMPLETED'
  AND "fileName" LIKE 'world-cup-prediction-match-start-%'
ORDER BY "completedAt" DESC NULLS LAST, "createdAt" DESC, "fileName" DESC
OFFSET :retention;
SQL
)"; then
    printf >&2 'Could not list old match-start backups for retention.\n'
    return 1
  fi

  if [ -z "$old_files" ]; then
    return 0
  fi

  printf '%s\n' "$old_files" | while IFS= read -r file_name; do
    case "$file_name" in
      */*|'')
        printf >&2 'Skipping unsafe backup filename from retention query: %s\n' "$file_name"
        ;;
      ${BACKUP_PREFIX}-*.dump)
        rm -f -- "$BACKUP_DIR/$file_name"
        printf 'Pruned old match-start backup file: %s/%s\n' "$BACKUP_DIR" "$file_name"
        ;;
      *)
        printf >&2 'Skipping non-automatic backup filename from retention query: %s\n' "$file_name"
        ;;
    esac
  done
}

process_pending_matches() {
  if ! pending_matches="$(list_pending_matches)"; then
    printf >&2 'Could not list pending match-start backups.\n'
    return 1
  fi

  if [ -z "$pending_matches" ]; then
    return 0
  fi

  printf '%s\n' "$pending_matches" | while IFS='|' read -r match_id match_number match_status; do
    if [ -z "$match_id" ]; then
      continue
    fi

    create_backup_for_match "$match_id" "$match_number" "$match_status" || true
  done

  prune_old_backups
}

main() {
  require_config
  mkdir -p "$BACKUP_DIR"
  wait_for_database

  printf 'Match-start backup worker started. backup_dir=%s retention=%s poll_interval_seconds=%s\n' \
    "$BACKUP_DIR" "$RETENTION" "$POLL_INTERVAL_SECONDS"

  while :; do
    if ! process_pending_matches; then
      printf >&2 'Match-start backup tick failed; retrying after %s seconds.\n' "$POLL_INTERVAL_SECONDS"
    fi
    sleep "$POLL_INTERVAL_SECONDS"
  done
}

main "$@"
