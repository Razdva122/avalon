#!/bin/sh
set -eu
cert=/etc/letsencrypt/live/avalon-prod.avalon-game.com
target=/opt/avalon/smtp/tls
[ "${RENEWED_LINEAGE:-$cert}" = "$cert" ] || exit 0
openssl x509 -in "$cert/fullchain.pem" -checkend 86400 -noout
cert_pub=$(openssl x509 -in "$cert/fullchain.pem" -pubkey -noout | openssl pkey -pubin -outform DER | sha256sum)
key_pub=$(openssl pkey -in "$cert/privkey.pem" -pubout -outform DER | sha256sum)
[ "$cert_pub" = "$key_pub" ]
install -m 600 "$cert/fullchain.pem" "$target/fullchain.pem.new"
install -m 600 "$cert/privkey.pem" "$target/privkey.pem.new"
mv "$target/fullchain.pem.new" "$target/fullchain.pem"
mv "$target/privkey.pem.new" "$target/privkey.pem"
if docker compose -f /opt/avalon/smtp/compose.yaml ps --status running --services | grep -qx smtp; then
  docker compose -f /opt/avalon/smtp/compose.yaml exec -T smtp postfix reload
  docker compose -f /opt/avalon/smtp/compose.yaml exec -T smtp doveadm reload
fi
