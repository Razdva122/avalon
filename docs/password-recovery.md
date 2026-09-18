# Password recovery with Yandex Cloud Postbox

The code is opt-in. No email verification, signup emails, or bulk announcements are sent. Existing accounts recover using their saved email. A typo in that address means its actual owner can receive the recovery link; users should check the address in profile settings.

## Configure sending

1. In Postbox, verify a domain and configure DKIM, SPF and DMARC. Use a dedicated sender, for example `security@avalon-game.com`. Configure a real support contact separately; Postbox is an outgoing mail service.
2. Create a service account with `postbox.sender` in the same folder as the sender. Create an API key with `yc.postbox.send`. SMTP uses the API key **ID** as username and its secret as password, host `postbox.cloud.yandex.net`, port 465, TLS.
3. Put secrets in the backend process environment or ignored `packages/backend/.env.local`. See `.env.example` for every variable. Create independent random `MAIL_ENCRYPTION_KEY` (32 bytes, hex) and `MAIL_EVENT_SECRET` (at least 32 characters). Never paste them into source control or chat.
4. Set `MAIL_FRONTEND_URL` to the exact HTTPS site origin, with no path. Development also permits localhost HTTP. Set `MAIL_TEST_RECIPIENTS` to a comma-separated list: **outside production nothing is sent to an address outside this list**, even when sending is enabled.
5. Configure the Postbox event bridge below and monitoring, then set `MAIL_ENABLED=true` and restart backend. Incomplete enabled configuration fails startup; disabled configuration starts normally and recovery displays its unavailable state.
6. Deploy frontend and nginx with backend. `/api/auth/` must proxy to backend and `/password-recovery/` must serve the SPA with no-store/no-referrer headers. Set `TRUSTED_PROXY_CIDRS` to the actual nginx source IP/CIDR, and block public direct access to backend port 3000. Nginx overwrites X-Forwarded-For; do not use `trust proxy=true`. If another trusted load balancer sits before nginx, configure nginx real_ip appropriately first.

Documentation: [sending](https://yandex.cloud/ru/docs/postbox/operations/send-email), [DNS](https://yandex.cloud/ru/docs/postbox/concepts/dns-records), [events](https://yandex.cloud/ru/docs/postbox/concepts/notification).

## Delivery events

Configure a Postbox configuration/event destination for Bounce and Complaint and attach it to the sender. Route notifications through a trusted Cloud Function (or equivalent private consumer). The consumer must parse the provider envelope and forward a **minimal Postbox event object for each recipient**, not a browser-supplied body, to:

```http
POST /api/auth/mail-events
Authorization: Bearer <MAIL_EVENT_SECRET>
Content-Type: application/json
```

Supported event shapes:

```json
{
  "eventType": "Bounce",
  "bounce": { "bounceType": "Permanent", "bouncedRecipients": [{ "emailAddress": "person@example.com" }] }
}
```

```json
{ "eventType": "Complaint", "complaint": { "complainedRecipients": [{ "emailAddress": "person@example.com" }] } }
```

Transient bounces and other events are acknowledged without suppression. The bridge must retry non-2xx responses; duplicate events are safe. Its endpoint should be private/authenticated by the selected Yandex notification mechanism. Do not expose a public forwarding function holding the shared secret. The provider-side trigger, service account, DNS records and secrets are deployment configuration, configured separately from the application. The deployable bridge is `deploy/postbox-events/index.js`; see the Russian rollout guide `docs/production-password-recovery.ru.md`.

Suppression lives in `mailSuppressions` as an HMAC of the normalized address. To remove one after investigating a support request, compute HMAC-SHA256 with `MAIL_ENCRYPTION_KEY` over `address:<lowercase-trimmed-email>` and delete only that `_id`. Do not clear the entire collection. A request for a suppressed address keeps the normal neutral response.

## Reliability and monitoring

The Mongo outbox is embedded in the account document, allowing atomic changes even with standalone MongoDB. A worker runs every five seconds. It uses per-job claims across processes, removes encrypted payloads after completion and cleans expired jobs/tokens. Token checks enforce expiry directly, independent of cleanup timing. Pending links are invalidated by email changes, ordinary password changes and successful recovery.

SMTP cannot guarantee exactly-once delivery after connection loss. Only explicit 4xx rejection gets automatic retries (one and two minutes, at most three attempts). Ambiguous outcomes, permanent errors and abandoned in-flight jobs are not resent automatically. The user can request another link; previous valid links remain usable until expiry or successful reset. Notification mail expires after 24 hours.

Monitor structured log events `mail_sent`, `mail_retry`, `mail_failed`, `mail_worker_failed`, `mail_global_limit`; alert on failure/limit spikes. Logs intentionally omit addresses, links, passwords, SMTP response bodies and keys. Also monitor queue age, Postbox complaint/bounce metrics and sender quotas. Default send limits are 1000/hour and 5000/day across workers; tune down for an early rollout. Counters are sliding windows in MongoDB. Address limits are 1/2 minutes, 3/hour and 5/day; IP requests and reset submissions each allow 10/15 minutes. IP-limit responses include Retry-After.

JWTs use a stored authVersion. Legacy tokens are version 0. Reset increments the version, revoking HTTP access and all subsequent socket events; local sockets disconnect immediately, remote-worker idle sockets within 60 seconds. Already-running requests cannot be recalled. No automatic login follows recovery.

Key rotation: finish/clear queued jobs and pending tokens before changing MAIL_ENCRYPTION_KEY, and rekey suppression records from a protected source of affected addresses, or retain the old key while migrating. Blind rotation makes stored suppression hashes unusable. Rollback/incident stop: set MAIL_ENABLED=false and restart; do not roll back version checking after users have reset passwords.

## Verification

```sh
npm run test --workspace=packages/backend -- --runInBand
npm run test --workspace=packages/ui
npm run build:ui
```

Recovery integration tests start an isolated temporary MongoDB through mongodb-memory-server-core (first run downloads MongoDB) and use a fake mail transport; no live credentials, production data or actual email. A staging smoke test with an allowlisted inbox is still required to verify DNS, SMTP credentials, the event bridge and delivery before production enablement.
