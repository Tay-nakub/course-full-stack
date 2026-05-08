#!/usr/bin/env bash
# Daily Postgres backup for the production coffee shop stack.
#
# Run on the VPS (where docker-compose.prod.yml is deployed). Cron entry
# (from `crontab -e` as the deploy user):
#
#   0 3 * * * /home/deploy/scripts/backup.sh >> /var/log/coffee-backup.log 2>&1
#
# Behaviour:
#   - pg_dump from the running coffee-postgres container, gzip on the host
#   - file lands in $BACKUP_DIR with a timestamp
#   - older than $RETENTION_DAYS removed
#   - exit non-zero on failure (so cron emails / log shows the error)

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/coffee}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
PG_CONTAINER="${PG_CONTAINER:-coffee-postgres}"
PG_USER="${PG_USER:-coffee}"
PG_DB="${PG_DB:-coffee}"

TIMESTAMP=$(date +'%Y%m%d-%H%M%S')
BACKUP_FILE="$BACKUP_DIR/coffee-${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Ensure the postgres container is up before attempting a dump
if ! docker ps --format '{{.Names}}' | grep -qx "$PG_CONTAINER"; then
  echo "[$(date -Is)] ERROR: container $PG_CONTAINER not running" >&2
  exit 1
fi

# Stream pg_dump → gzip → file. -T avoids tty allocation in cron.
docker exec -i "$PG_CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" \
  | gzip -9 > "$BACKUP_FILE"

# Sanity check — non-empty file
if [ ! -s "$BACKUP_FILE" ]; then
  echo "[$(date -Is)] ERROR: backup file is empty: $BACKUP_FILE" >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Rotate old backups
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'coffee-*.sql.gz' \
  -mtime +"$RETENTION_DAYS" -delete

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date -Is)] Backup OK: $BACKUP_FILE ($SIZE)"
