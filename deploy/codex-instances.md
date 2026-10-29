# Multiple ChatGPT instances

The backend can run one or two AI matches per configured instance. `AI_CODEX_INSTANCES`
is a JSON array in the backend environment (1–32 entries). Each instance must
use a **distinct ChatGPT account**, with its own Codex authentication directory
or SSH worker. No browser changes are required.

Set optional `maxGames: 2` on an existing named entry to share that account across
two games; omitted or `1` preserves the original capacity. Other values are rejected.
For example, `{"id":"account-one","home":"/var/lib/codex-one","maxGames":2}`.
Do not duplicate an account or SSH destination to create game slots. Quotas, caches,
resets and usage identity stay account-scoped; each game has its own atomic MongoDB
lease. The original lease document remains the first slot and `:slot2` is the second.
Administrator status is free while a slot remains; its account card lists both rooms.
For overlapping games, per-game quota percentages are unavailable and account sums
are marked incomplete, since account snapshots include both games. Token totals
remain exact from request audits.

## Local profiles

```yaml
services:
  backend:
    environment:
      AI_ROOMS_ENABLED: 'true'
      AI_CODEX_ENABLED: 'true'
      AI_CODEX_INSTANCES: >-
        [{"id":"account-one","home":"/var/lib/codex-one"},
         {"id":"account-two","home":"/var/lib/codex-two"}]
    volumes:
      - /opt/avalon/codex-one:/var/lib/codex-one
      - /opt/avalon/codex-two:/var/lib/codex-two
```

Authenticate each directory separately using the existing local login procedure
in [codex-production.md](codex-production.md), setting `CODEX_HOME` to that
instance's directory inside the backend container. Keep auth files outside Git
and images. The existing `AI_CODEX_BIN` applies to all local profiles.

## SSH workers

```yaml
services:
  backend:
    environment:
      AI_ROOMS_ENABLED: 'true'
      AI_CODEX_ENABLED: 'true'
      AI_CODEX_INSTANCES: >-
        [{"id":"account-one","ssh":{"host":"worker-one.example.com","user":"avalon-codex","port":10022,"key":"/run/codex-ssh/one","knownHosts":"/run/codex-ssh/known_hosts"}},
         {"id":"account-two","ssh":{"host":"worker-two.example.com","user":"avalon-codex","port":10022,"key":"/run/codex-ssh/two","knownHosts":"/run/codex-ssh/known_hosts"}}]
    volumes:
      - /opt/avalon/codex-ssh:/run/codex-ssh:ro
```

Provision each independent worker using [codex-production.md](codex-production.md).
Use the independent-request worker described in that guide. Each endpoint must actually select its own
account/auth state. The supplied launcher uses `/opt/avalon-codex/state`, so use
separate worker machines with the standard launcher. Two SSH users pointing to
the same standard launcher are **not** separate accounts.

Local and SSH entries may be mixed. `port` defaults to `10022`. IDs contain
letters, numbers and hyphens, start with a letter or number, and are at most
64 characters. `default` is reserved for legacy configuration. Duplicate IDs,
local directory paths and SSH user/host/port destinations are rejected. Different
paths or DNS aliases for the same account must not be listed as separate instances.
Explicit pool entries do not inherit legacy `AI_CODEX_HOME` / `CODEX_HOME` or
`AI_CODEX_SSH_*` connection settings.

## Selection and lifetime

- A public room atomically reserves a free instance during preparation. Only
  instances supporting the selected model/reasoning and passing both existing
  quota thresholds are eligible. Quota failures and missing models fail closed.
- Rank eligible free instances by **remaining five-hour percentage**, then
  **remaining weekly percentage**. A subscription explicitly reporting no
  five-hour window ranks by its weekly percentage. Equal quotas use config order.
  Percentages compare reported remaining allowance, not absolute token capacity
  across different subscription tiers.
- Quotas are cached separately per connection for one minute, model catalogs for
  five minutes. Launch repeats the eligibility check on the reserved instance.
- Keep the instance across decisions, technical pauses/resume and post-game
  processing, except when a decision reports subscription quota exhaustion.
  Retry that unfinished request on another account supporting the same model and
  reasoning, with positive weekly and five-hour allowance (weekly-only accounts
  skip the five-hour check). Prefer available normal slots, then the least-loaded
  busy account, allowing an emergency continuation beyond `maxGames`.
  Concurrent requests share the room's account switch; completed decisions remain
  applied. Do not revisit exhausted accounts during the same run. If none remain,
  retain the normal technical pause. Other technical errors do not switch accounts.
  A manual technical resume starts a new attempt without the new-game quota gate.
- One game per account by default, or two with `maxGames: 2`.
  If all eligible accounts are busy, reject a new reservation without a queue.
  The same participant returns to their existing game.
- Emergency continuation leases appear in occupancy and the dashboard, renew
  during play/pause, and release without affecting other games. Request token
  costs stay attributed to the account that handled each request. Games that
  change accounts have no per-game percentage estimate, since quota snapshots
  from different accounts cannot be subtracted.
- Keep existing bot thresholds: smart `>60%` short / `>5%` weekly; regular
  `>30%` / `>3%`; beginner `>20%` / `>1%`. Weekly-only accounts skip the short gate.
  Player counts, model settings and Premium admission are unchanged.
- Public preparation expires after 60 seconds (120 seconds with friends).
  Administrator spectator drafts renew their lease while waiting for configuration.
  Technical pauses retain the account for up to the existing 15-minute timeout.
- Completion, cancellation and preparation/pause expiry release only that room's
  lease. MongoDB owner checks prevent stale cleanup from releasing another room.
  A crashed backend's abandoned lease expires after `AI_LEASE_MS` (currently
  42 minutes, covering queueing and a transport retry). Existing restart behavior still stops archived unfinished games.
- Beginner analysis briefly reserves a free account too, with model support
  checked for that account; it cannot spend on an account held by a game.
  Cached reviews remain readable without free capacity.
- Admin quota/catalog endpoints describe the administrator's pinned room, or
  the highest-quota free account before a room has been created. Connection
  details and instance IDs stay on the server, outside public room state/replays.

## Rollout and rollback

Without `AI_CODEX_INSTANCES`, existing single-instance environment variables and
the existing MongoDB lease ID continue to work. Setting an invalid or empty pool
configuration disables allocation rather than silently using the legacy account.

Before enabling a pool, drain all existing AI games and stop the old backend.
Use stable instance IDs and the same configuration on backend replicas; changing
IDs creates new lease identities. Do not overlap old single-instance backends
with a pool containing that same physical account, or rename/reassign instances
while games are active. Restart only after active games and reviews have ended.
Rolling back to legacy mode likewise requires draining/stopping the pool first.

Before enabling two games, install the updated launcher on that account worker:
two execution slots share **512 MiB RAM, one CPU and 256 tasks**, with no swap.
Per-container ceilings are 512 MiB/one CPU/128 tasks. Queue admission is serialized
under `worker-queue.lock`, with SSH heartbeats and cancellation while waiting;
the queue deadline is 600 seconds. A decision keeps its separate 600-second deadline.
The backend SSH deadline is 1,215 seconds. Queued calls are never model-turn retries.
Metadata uses the same bounded queue. Install worker first, then backend, and only
then set `maxGames: 2` after draining all games/reviews. Check parent cgroup limits
and leave host headroom; increasing account capacity does not fix upstream HTTP 429.
For rollback drain both slots before restoring the old backend/launcher or reducing
capacity; preserve auth, lock files, account IDs and usage ledgers.

This change does not provision or authenticate additional accounts and does not
modify production configuration automatically.

## Private operational records

Keep live host addresses, account mappings, host keys, deployment receipts and
rollback records outside Git. Local operator notes may be stored in the ignored
`.private-ops/` directory; public documentation should use example endpoints only.
