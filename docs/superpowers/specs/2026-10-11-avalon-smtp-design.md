# Avalon SMTP on the existing VPS

The user approved preparing a private outgoing SMTP service on Avalon VPS 157.228.134.198 and exactly one test message to lexur-02@yandex.ru. This preparation does not authorize extra test messages or removal of Postbox/paid FirstByte hosting.

Use the upstream stable Docker Mailserver 16.0.1 image pinned to its pulled digest, with Postfix, OpenDKIM, and Dovecot authentication/local delivery. Disable IMAP/POP3, spam/virus scanners, update emails, and email reports. Keep persistent queue, logs, account configuration and DKIM keys under /opt/avalon/smtp, private to root. Permit no unauthenticated relay or forged authenticated senders. Fail closed if DKIM signing is unavailable. No public listening mail ports: join the existing private production Docker network and expose SMTPS only on host loopback for diagnostics. The application uses its own SMTP credentials and the internal DNS alias avalon-prod.avalon-game.com, matching a new Let's Encrypt certificate.

Publish avalon-prod.avalon-game.com A 157.228.134.198 (matching existing PTR), a unique 2048-bit DKIM selector vps20261011, and add ip4:157.228.134.198 to existing SPF. Preserve current MX, old selectors and previous senders for rollback. Duplicate additive changes in retained Yandex DNS during the delegation cache window. Issue a dedicated certificate using the existing HTTP ACME webroot, minimally adding the hostname to the HTTP challenge server. A deploy hook refreshes SMTP TLS files and reloads the mail service after renewal.

Keep the current Avalon 71.3.0 production image and all mail encryption/event secrets and limits (20/hour, 100/day). Rebase generic SMTP support onto current source. Test against the new SMTP before changing application environment. Queue acceptance, recipient-server delivery, and user inbox receipt are distinct checks. Send one authorized test only after TLS, authentication, DNS and relay checks pass; inspect actual DKIM signing and the remote SMTP response. Await receipt confirmation before activating the provider in production.

Back up all changed configuration. The SMTP service starts independently; production compose and backend remain unchanged during preparation. Preserve rollback to previous sender. Add a monitor and backup integration for the mail state so failures are visible; avoid automated outgoing email notifications.

## Approved amendment: technical incoming mail

After confirming the outgoing test in the inbox and activating own SMTP, the
user asked to stop paying for FirstByte mail hosting and explicitly approved
accepting then deleting replies/bounces on the VPS. This supersedes the initial
private-only listener and retained FirstByte MX constraints. Publish IPv4 port25
without authentication, with known-recipient validation and no relay. Use native
Postfix discard transports for both virtual-domain and hostname-local delivery;
retain the account solely for sender authentication and recipient validation.
Port465 remains private. No readable inbox exists; queued mail is discarded,
while delivery metadata remains in logs. Point MX at avalon-prod and remove
obsolete FirstByte hosting A/SPF/DKIM records. Keep separate free DNS hosting.

Verify public TLS, explicit relay denial, rejected unknown recipients, local
discard with a null-envelope test and no mailbox growth, then private outgoing
authentication without sending another external message. Monitor inbound
configuration and public restrictions; include the amended configuration in
the existing encrypted off-host backup. No backend restart is required.
