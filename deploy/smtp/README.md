# SMTP service operations

This directory contains reusable Docker Mailserver configuration and checks.
Live hostnames, IP addresses, account records, DNS selectors, test evidence and
rollback receipts belong in private operator records, outside Git.

## Private configuration

Create root-owned directories `config`, `data`, `state`, `logs`, and `tls` under
`/opt/avalon/smtp`. Copy the service files there and install `postfix-main.cf` as
`config/postfix-main.cf`. Restore account records, DKIM keys, `backend-smtp.env`,
mail data and state from a verified private backup. Do not regenerate credentials
or replay a restored queue without reviewing the effects.

Copy `deployment.env.example` to `/opt/avalon/smtp/deployment.env`, substitute
private values and set mode 0600. Configure the actual SMTP hostname, public
bind IP, container IP, existing Docker network, certificate lineage and an
external recipient for RCPT-only relay checks. Ensure the container address
belongs to the selected existing network. Never commit the filled environment.
The health service reads this file through `EnvironmentFile`; the certificate
renewal hook sources and exports it before invoking Compose.

Configure A/PTR, SPF, DKIM and MX from the private deployment record. Preserve
existing senders and selectors until rollback is no longer needed. Issue the
SMTP hostname's certificate using the application's existing ACME webroot and
install `renew-certificate.sh` as a root-executable certificate deploy hook.

Only the public IPv4 SMTP port accepts unauthenticated incoming domain mail.
SMTPS stays on the private Docker network, with a loopback diagnostic mapping.
Known inbound recipients use Postfix's discard transport, so replies and
bounces are accepted and discarded rather than delivered to a readable inbox.
Authenticated application mail remains separate; unauthenticated relay and
sender spoofing must remain forbidden.

## Start and check

Load the private environment before running Compose or manual checks:

```sh
set -a
. /opt/avalon/smtp/deployment.env
set +a
docker compose -f /opt/avalon/smtp/compose.yaml config --quiet
docker compose -f /opt/avalon/smtp/compose.yaml up -d
python3 /opt/avalon/smtp/check.py
python3 /opt/avalon/smtp/check-inbound.py
python3 /opt/avalon/smtp/health.py
```

The ordinary checks do not send email: RCPT checks end with RSET without DATA.
`check-inbound.py --discard-test` sends only a controlled local null-sender
message to verify discard behavior; run it only when that test is authorized.
External email tests require separate authorization. Keep test markers private
to avoid duplicate sends.

Install the health service/timer under `/etc/systemd/system`, reload systemd,
and enable the timer. It checks SMTP processes, TLS/certificate expiry, queue
age and size, discard configuration and public SMTP restrictions. Results stay
in the host's private health record and systemd journal.

Keep the mail server's certificate change detector running. After renewal,
verify the certificate actually served on loopback, rather than relying only
on the deploy hook's exit status. Preserve signing keys, credentials, queue and
state in encrypted backups.

Application configuration uses `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` and
`SMTP_PASSWORD`. Preserve mail encryption/event secrets and sending limits.
Changing application configuration requires the usual deployment lock, game
checks, backend health checks and a prepared rollback. Per-host activation and
recovery records must remain outside the public repository.
