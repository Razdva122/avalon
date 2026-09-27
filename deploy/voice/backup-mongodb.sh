#!/bin/sh
# Standalone MongoDB backup. Never enable shell tracing here.
set -eu
[ "$#" -eq 1 ] || { echo 'Usage: backup-mongodb.sh OUTPUT.archive.gz' >&2; exit 2; }
backup=$1
container=${MONGODB_CONTAINER:-mongodb}
mutex=${MONGODB_BACKUP_LOCK_DIR:-/var/lock/avalon-mongodb-backup}
umask 077
partial=''
mutex_owned=0
acquisition_attempted=0
unlock_database() {
  docker exec "$container" sh -c 'exec mongosh --quiet --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --eval "const admin = db.getSiblingDB(\"admin\"); if (admin.currentOp().fsyncLock === true) { const r = admin.fsyncUnlock(); if (r.ok !== 1) quit(1); }"' >/dev/null
}
cleanup() {
  status=$?
  trap - EXIT HUP INT TERM
  if [ "$acquisition_attempted" -eq 1 ]; then
    if ! unlock_database; then
      echo 'MongoDB unlock could not be verified. Check its lock state and remove the backup mutex only after recovery.' >&2
      status=1
      mutex_owned=0 # Keep the mutex to prevent another backup from touching an uncertain lock.
    fi
  fi
  [ -z "$partial" ] || rm -f "$partial"
  if [ "$mutex_owned" -eq 1 ]; then rmdir "$mutex"; fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM
# All invocations on this deployment host share one mutex, regardless of output path.
if ! mkdir "$mutex"; then
  echo 'Another backup owns the mutex; verify recovery before removing a stale mutex.' >&2
  exit 1
fi
mutex_owned=1
partial=$(mktemp "${backup}.partial.XXXXXX")
# An existing administrative lock belongs to somebody else: never unlock it.
docker exec "$container" sh -c 'exec mongosh --quiet --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --eval "if (db.getSiblingDB(\"admin\").currentOp().fsyncLock === true) quit(2);"' >/dev/null
# Set before the remote operation: the server may lock even if docker loses the response.
acquisition_attempted=1
docker exec "$container" sh -c 'exec mongosh --quiet --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --eval "const r = db.getSiblingDB(\"admin\").fsyncLock(); if (r.ok !== 1) quit(1);"' >/dev/null
docker exec "$container" sh -c 'exec mongodump --quiet --archive --gzip --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin' > "$partial"
test -s "$partial"
gzip -t "$partial"
unlock_database
acquisition_attempted=0
mv "$partial" "$backup"
