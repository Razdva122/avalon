# Avalon private outgoing SMTP

Docker Mailserver 16.0.1 runs independently under `/opt/avalon/smtp`. It joins
`avalon-production_production` at `172.30.90.20`, with the internal alias
`avalon-prod.avalon-game.com`. Only the loopback diagnostic port 1465 is published.
MX and incoming mail remain at FirstByte hosting; this service sends application mail.

## Reconstructing the service

Create root-private directories `config`, `data`, `state`, `logs`, `tls` under
`/opt/avalon/smtp`. Copy `compose.yaml`, `check.py`, `health.py`, and
`renew-certificate.sh` there. **Install `postfix-main.cf` into
`/opt/avalon/smtp/config/postfix-main.cf`**, not beside compose: this makes DKIM
failure temporary instead of silently sending unsigned mail.

Restore the encrypted runtime backup's account database, DKIM keys, private
`backend-smtp.env`, mail data, and state. Do not regenerate DKIM or passwords
without updating DNS/application credentials. Examine restored queue entries
before allowing delivery: a live-file backup can contain previously delivered
messages, and replay can duplicate mail. Quiesce SMTP for a strict queue snapshot.

Publish A `avalon-prod.avalon-game.com` → `157.228.134.198`; existing PTR already
matches. Add `ip4:157.228.134.198` to the single existing SPF record. Publish the
2048-bit DKIM TXT under selector `vps20261011`. Preserve old senders/selectors
until rollback is no longer needed. Public DNS is delegated to FirstByte.

Issue a dedicated Let's Encrypt webroot certificate for the SMTP hostname under
`/opt/avalon/production/acme`. Add that hostname to the HTTP ACME server in
`nginx.conf`. Avalon 71.3.0 generates `/etc/nginx/avalon-runtime.conf` using
`/usr/local/share/avalon/board-route.awk`; regenerate, validate, and reload this
runtime file when changing nginx, as the ordinary config is not the active one.

Install `renew-certificate.sh` as root-executable
`/etc/letsencrypt/renewal-hooks/deploy/avalon-smtp`, run it once, then
`docker compose -f /opt/avalon/smtp/compose.yaml up -d`. The Docker Mailserver
change detector copies the mounted manual certificate into its internal TLS
directory and reloads daemons; keep `changedetector` running. After renewal,
verify the certificate actually served on loopback, not just hook exit status.

Install the health service/timer under `/etc/systemd/system`, reload systemd,
and enable the timer. It checks processes, trusted TLS, certificate expiry,
and queue size/age every five minutes. Failures are recorded in `health.json`
and the systemd journal; no email notifications are sent.

The existing encrypted Avalon backup includes `/opt/avalon/smtp` and
`/etc/letsencrypt`; its remote checksum readback is verified before success.
Protect decrypted backups: they contain SMTP credentials and signing keys.

## Checks and operation

```sh
python3 /opt/avalon/smtp/check.py  # auth/relay security; sends zero messages
python3 /opt/avalon/smtp/health.py
docker compose -f /opt/avalon/smtp/compose.yaml ps
docker compose -f /opt/avalon/smtp/compose.yaml logs --tail 100 smtp
docker compose -f /opt/avalon/smtp/compose.yaml exec -T smtp postqueue -p
systemctl status avalon-smtp-health.timer avalon-smtp-health.service
```

The sole authorized test on 2026-10-11 was DKIM signed, accepted by Yandex with
250 2.0.0, and confirmed in the user's inbox. Queue ID `23608E007B`;
Message-ID `<c06c47d9-9a0a-6973-8746-c110ba8c7ec1@avalon-game.com>`.
Private send markers/evidence prevent duplicate tests. Do not run another
external mail test without authorization.

Application configuration uses `SMTP_HOST`, `SMTP_PORT=465`, `SMTP_USER`,
`SMTP_PASSWORD`; retain `MAIL_FROM`, encryption/event secrets, and current
20/hour, 100/day limits. The generic SMTP patch must reach the normal release
source before a later image replaces a temporary derived backend image.

Before application activation obtain a verified backup, take `deploy.lock`,
confirm the exact current image and source hashes, and check live games. Run
`check-idle.cjs` as a file: its `require.main` guard does not run under `node -`.
The public room list is capped at 20; a full page cannot prove safe restart.
If rooms remain, defer activation or get explicit approval for their reset.
Replace only the backend; validate voice health 204, HTTPS and Socket.IO.
Restore freshly saved backend env/compose/image on failure; never restore
old 71.2.0 artifacts over the current release.

For Postbox rollback remove all four generic SMTP fields together and retain
the old Postbox credentials. Postbox connectivity was unavailable during this
incident; its configuration alone does not establish a functioning fallback.
Keep paid FirstByte inbox and Yandex services until their separate dependencies
and bounce handling have been reviewed.

## Current activation

Avalon71.3.0 uses the private SMTP after the user authorized resetting abandoned
waiting rooms. Backend-only activation passed HTTPS, Socket.IO and voice204.
The previous image/env/compose remain private in
`/opt/avalon/smtp/activation-20261011T142854Z`. The derived backend image is
`sha256:13534af11de7a5d763a0119e9aeac74a107364907ddcfc08f32d11be03d16f0b`.
