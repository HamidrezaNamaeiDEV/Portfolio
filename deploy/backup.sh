#!/usr/bin/env bash
set -euo pipefail
umask 077
here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
: "${PORTFOLIO_ENV_FILE:?Set the external Compose env file}"
: "${PORTFOLIO_PROJECT:?Set the Compose project name}"
: "${BACKUP_DIR:?Set the private local spool directory}"
: "${AGE_RECIPIENT:?Set the off-host recovery public key}"
: "${BACKUP_TARGET:?Set the SSH host alias and destination directory}"

mkdir -p -- "$BACKUP_DIR"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
spool=$(mktemp -d "$BACKUP_DIR/$PORTFOLIO_PROJECT-$stamp.XXXXXX")
filename="${spool##*/}.dump.age"
compose=(docker compose --env-file "$PORTFOLIO_ENV_FILE" -p "$PORTFOLIO_PROJECT" -f "$here/compose.yaml")
"${compose[@]}" exec -T db pg_dump -Fc --no-owner --no-acl -U portfolio_backup portfolio |
  age -r "$AGE_RECIPIENT" -o "$spool/$filename.partial"
mv -- "$spool/$filename.partial" "$spool/$filename"
(cd "$spool" && sha256sum "$filename" > "$filename.sha256")
scp -o BatchMode=yes -o StrictHostKeyChecking=yes \
  "$spool/$filename" "$spool/$filename.sha256" "$BACKUP_TARGET"
printf 'Archived %s\n' "$filename"
