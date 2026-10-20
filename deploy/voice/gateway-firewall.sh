#!/bin/sh
set -eu
: "${VOICE_MEDIA_CIDR:?Set the private media-server CIDR}"
# Docker published ports bypass UFW INPUT. Restrict only the external interface;
# nginx reaches backend:7882 inside the Docker network.
iptables -w -C DOCKER-USER -i eth0 -p tcp --dport 7882 ! -s "$VOICE_MEDIA_CIDR" -j DROP 2>/dev/null ||
  iptables -w -I DOCKER-USER 1 -i eth0 -p tcp --dport 7882 ! -s "$VOICE_MEDIA_CIDR" -j DROP
