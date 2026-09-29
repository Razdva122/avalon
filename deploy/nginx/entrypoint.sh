#!/bin/sh
set -eu

# Respect explicit diagnostic commands and custom nginx configuration arguments.
if [ "${1:-}" = nginx ]; then
  custom_config=false
  for argument in "$@"; do
    case "$argument" in -c|-c?*) custom_config=true ;; esac
  done
  if [ "$custom_config" = false ]; then
    runtime=/etc/nginx/avalon-runtime.conf
    awk -f /usr/local/share/avalon/board-route.awk /etc/nginx/nginx.conf > "$runtime.next"
    mv "$runtime.next" "$runtime"
    nginx -t -c "$runtime"
    shift
    set -- nginx -c "$runtime" "$@"
  fi
fi
exec /docker-entrypoint.sh "$@"
