#!/bin/sh
set -eu

# Respect explicit diagnostic commands and custom nginx configuration arguments.
if [ "${1:-}" = nginx ]; then
  custom_config=false
  for argument in "$@"; do
    case "$argument" in -c|-c?*) custom_config=true ;; esac
  done
  if [ "$custom_config" = false ]; then
    # Existing image files remain the initial release. Later deploys replace
    # only this symlink, leaving nginx and all listening sockets running.
    if [ ! -L /app/.avalon-current ]; then
      test ! -e /app/.avalon-current
      ln -s . /app/.avalon-current
    fi
    runtime=/etc/nginx/avalon-runtime.conf
    awk -f /usr/local/share/avalon/board-route.awk /etc/nginx/nginx.conf > "$runtime.routes"
    sed 's@root[[:space:]][[:space:]]*/app[[:space:]]*;@root /app/.avalon-current;@g' "$runtime.routes" > "$runtime.next"
    rm "$runtime.routes"
    nginx -t -c "$runtime.next"
    mv "$runtime.next" "$runtime"
    shift
    set -- nginx -c "$runtime" "$@"
  fi
fi
exec /docker-entrypoint.sh "$@"
