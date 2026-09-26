#!/bin/sh
set -eu
[ "${RENEWED_LINEAGE:-}" = /etc/letsencrypt/live/voice.avalon-game.com ] || exit 0
docker exec nginx nginx -t
docker exec nginx nginx -s reload
