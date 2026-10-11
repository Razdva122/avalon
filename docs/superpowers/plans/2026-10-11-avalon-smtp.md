# Avalon private SMTP implementation plan

> **For agentic workers:** Use executing-plans inline in the existing isolated worktree. Steps use checkbox syntax for tracking.

**Goal:** Prepare a private, authenticated outgoing SMTP on the existing Avalon VPS and verify one authorized delivery before activating it.

**Architecture:** A separate Docker Compose service joins the existing production network with a dedicated hostname and certificate. Postfix persists its queue, OpenDKIM signs mail, and Dovecot supplies authenticated submission without public mailbox ports. Avalon generic SMTP support stays compatible with Postbox rollback.

**Tech Stack:** Docker Mailserver 16.0.1, Docker Compose, Let's Encrypt, existing TypeScript/Nodemailer backend.

**Spec:** ../specs/2026-10-11-avalon-smtp-design.md

## Global constraints

- Exactly one authorized test email to lexur-02@yandex.ru.
- No public SMTP/IMAP/POP3 listeners, unauthenticated relay or spoofing.
- Dedicated 2048-bit DKIM selector vps20261011; TLS 1.2 or higher with certificate verification.
- Preserve production image/version, existing secrets and limits 20/hour and 100/day.
- No application SMTP switch before confirmed delivery; retain Postbox and current MX for rollback.

## Tasks

- [x] Rebase existing generic SMTP change onto current 71.3.0; inspect live network and certificate layout; pull and pin upstream mail image.
- [x] Add a non-sending integration check for SMTP TLS, valid/invalid authentication, sender spoofing and unauthenticated relay. Run before service creation to establish failure; rerun after configuration. This is a security check against real SMTP, not a configuration-mirroring unit test.
- [x] Configure separate mail Compose with private production network, loopback diagnostics port, persistent queue/logs/config, disabled automatic reports and dedicated TLS. Generate credentials and DKIM with upstream tooling without printing secrets.
- [x] Publish additive DNS changes in delegated FirstByte; query authoritative servers to verify exact A/SPF/DKIM values. Add only the dedicated HTTP ACME name to nginx, validate before reload, issue certificate and install its renewal hook.
- [x] Start SMTP alone. Check effective Postfix configuration, DKIM key/DNS correspondence, service health and relay security; verify no public mail listeners. Run existing recovery tests after rebasing.
- [x] Send the single authorized test via the candidate Nodemailer transport; persist its message ID/queue ID and mark the send before invoking SMTP to prevent duplicates. Inspect signing and recipient SMTP response, then ask the user to confirm inbox/spam receipt.
- [x] Add mail state to backups, document operation and rollback, and commit the reviewed configuration. Record preparation status and remaining production activation work.

## Execution result

Own SMTP is active in Avalon 71.3.0. The one test was DKIM signed, Yandex accepted it with 250, and the user confirmed inbox receipt. User explicitly authorized restarting abandoned rooms. Backend-only activation passed HTTPS, Socket.IO and voice204; image sha256:13534af11de7a5d763a0119e9aeac74a107364907ddcfc08f32d11be03d16f0b. All50recoverytests passed, including the reviewed missing-host guard. SMTP runtime is included in encrypted off-host backups; readback checksum verified. Health monitor is enabled.

Retained Yandex zone could not be synchronized because its console RPC reported Channel closed before call started. Current delegation and exact A/SPF/DKIM were verified on all six FirstByte NS plus Google/Cloudflare. This inactive old zone was not deleted.

Normal deploy.py invokes the idle checker via stdin, which does not execute its require.main guard. This migration ran the checker as a file, then obtained explicit user approval because the20-room inventory was truncated and contained three waiting rooms. Repairing the normal deployment guard remains a separate follow-up; never rely on its silent stdin success.
