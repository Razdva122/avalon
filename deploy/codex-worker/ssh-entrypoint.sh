#!/bin/sh
set -eu
# The only accepted SSH command. No shell, argument passthrough or file transfer.
if [ "${SSH_ORIGINAL_COMMAND:-}" != 'avalon-codex-v1' ]; then
  printf '%s\n' '{"ok":false,"error":"access_denied"}'
  exit 1
fi
exec /usr/bin/sudo -n /opt/avalon-codex/worker-launch
