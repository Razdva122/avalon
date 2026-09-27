#!/bin/sh
set -eu
base=/opt/avalon/voice-release
cd "$base"
docker compose -p coi -f compose.yaml config --quiet
# /app is the backend image's working directory; use its installed dependencies.
docker run --rm --entrypoint node -v "$base/check-idle.cjs:/app/check-idle.cjs:ro" avalon-backend:voice-9dcab62a /app/check-idle.cjs
backup="$base/mongodb-before-voice-$(date -u +%Y%m%dT%H%M%SZ).archive.gz"
sh "$base/backup-mongodb.sh" "$backup"
# Check again after backup, before interrupting any processes.
docker run --rm --entrypoint node -v "$base/check-idle.cjs:/app/check-idle.cjs:ro" avalon-backend:voice-9dcab62a /app/check-idle.cjs
cp compose.yaml compose.voice.yaml
systemctl disable --now yc-container-daemon.service
systemctl enable avalon-app-release.service
if ! systemctl start avalon-app-release.service; then
  cp compose.rollback.yaml compose.yaml
  systemctl restart avalon-app-release.service
  echo 'New release failed; original application restored.' >&2
  exit 1
fi
