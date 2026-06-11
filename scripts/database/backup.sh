#!/usr/bin/env sh
set -eu

backup_dir="${BACKUP_DIR:-backups}"
timestamp="$(date +%Y%m%d-%H%M%S)"
output_file="${1:-$backup_dir/world-cup-prediction-$timestamp.dump}"

if [ -e "$output_file" ]; then
  printf >&2 'Backup file already exists: %s\n' "$output_file"
  exit 1
fi

output_dir="$(dirname "$output_file")"
mkdir -p "$output_dir"

temp_file="$(mktemp "$output_dir/.database-backup.XXXXXX")"
cleanup() {
  rm -f "$temp_file"
}
trap cleanup EXIT HUP INT TERM

docker compose exec -T database sh -eu -c '
  : "${POSTGRES_USER:?POSTGRES_USER is required}"
  : "${POSTGRES_DB:?POSTGRES_DB is required}"

  pg_dump \
    --format=custom \
    --no-owner \
    --no-privileges \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB"
' > "$temp_file"

chmod 600 "$temp_file"
mv "$temp_file" "$output_file"
trap - EXIT HUP INT TERM

printf 'Database backup written to %s\n' "$output_file"
