#!/bin/sh
set -eu
[ "${RENEWED_LINEAGE:-}" = /etc/letsencrypt/live/turn.avalon-game.com ] || exit 0
cert="$RENEWED_LINEAGE/fullchain.pem"
key="$RENEWED_LINEAGE/privkey.pem"
openssl x509 -in "$cert" -checkend 86400 -noout >/dev/null
cert_pub=$(openssl x509 -in "$cert" -pubkey -noout | openssl pkey -pubin -outform DER | sha256sum)
key_pub=$(openssl pkey -in "$key" -pubout -outform DER | sha256sum)
[ "$cert_pub" = "$key_pub" ] || exit 1
base=/opt/avalon/deploy/voice
install -m 600 "$cert" "$base/tls/fullchain.pem.next"
install -m 600 "$key" "$base/tls/privkey.pem.next"
mv "$base/tls/fullchain.pem.next" "$base/tls/fullchain.pem"
mv "$base/tls/privkey.pem.next" "$base/tls/privkey.pem"
if [ ! -e /var/lib/avalon-voice-watchdog/latched ]; then
  docker compose -f "$base/compose.yaml" restart livekit
fi
