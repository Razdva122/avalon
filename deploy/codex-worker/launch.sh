#!/bin/bash
set -eu
# Only this root-owned launcher is permitted by sudo. No caller arguments.
[ "$#" -eq 0 ] || exit 1
exec 9>/opt/avalon-codex/worker.lock
if ! flock -n 9; then
  printf '%s\n' '{"ok":false,"error":"busy"}'
  exit 0
fi
container="avalon-codex-worker-$$"
heartbeat=''
child=''
umask 077
output=$(mktemp /opt/avalon-codex/result.XXXXXX)
cleanup() {
  if [ -n "$heartbeat" ]; then
    kill "$heartbeat" >/dev/null 2>&1 || true
    wait "$heartbeat" 2>/dev/null || true
  fi
  if [ -n "$child" ]; then
    kill -KILL "$child" >/dev/null 2>&1 || true
    wait "$child" 2>/dev/null || true
  fi
  # Also cover a create/start request that was in flight when SSH disconnected.
  for attempt in 1 2 3 4 5; do
    docker rm -f "$container" >/dev/null 2>&1 || true
    sleep 0.2
  done
  rm -f "$output"
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM
# Complete creation before spawning the attach client: cleanup always has a
# registered container to remove, even if SSH stops during slow image/storage work.
docker create -i --name "$container" --memory=256m --memory-swap=256m \
  --cpus=0.5 --pids-limit=64 --cap-drop=ALL --security-opt=no-new-privileges \
  --read-only --user=10001:10001 --tmpfs /tmp:rw,nosuid,nodev,size=64m,mode=1777 \
  -e HOME=/tmp -e CODEX_HOME=/state \
  -v /opt/avalon-codex/state:/state \
  -v /opt/avalon-codex/worker.cjs:/worker.cjs:ro \
  --entrypoint node avalon-codex:0.159.2 /worker.cjs </dev/null >/dev/null
docker start -a -i "$container" <&0 >"$output" &
child=$!
launcher=$$
# This pipe belongs to SSH itself, unlike the container's stdout (owned by dockerd).
# A disconnected client must terminate the launcher and remove the whole container.
(
  trap 'kill -TERM "$launcher"; exit 1' PIPE
  while kill -0 "$child" 2>/dev/null; do
    sleep 1
    if ! printf '\n'; then kill -TERM "$launcher"; exit 1; fi
  done
) &
heartbeat=$!
status=0
wait "$child" || status=$?
kill "$heartbeat" >/dev/null 2>&1 || true
wait "$heartbeat" 2>/dev/null || true
heartbeat=''
if [ "$status" -ne 0 ]; then
  printf '%s\n' '{"ok":false,"error":"failed"}'
else
  cat "$output"
fi
