# Codex on the production backend

[Documentation index](../docs/README.md)

The backend image installs `@openai/codex@0.159.2`. Select an image built from the current repository; older images may lack
production opt-in or remote transport.
Codex stays disabled until `AI_CODEX_ENABLED=true`; all existing administrator
access checks and subscription usage accounting remain in place.
Codex is the only supported AI provider; there is no paid inference fallback.
The AI Arena also requires `AI_ROOMS_ENABLED=true`, included in the fragment.

## Choose the transport

Use local mode when the backend container can authenticate with ChatGPT directly.
Use the [remote Compose fragment](compose-codex-remote.fragment.yaml) when the
CLI and credentials are hosted on a separate worker. Remote mode is selected by
`AI_CODEX_SSH_HOST` and requires user, key and pinned known_hosts paths; the default
SSH port is 10022. Do not merge both authentication layouts by accident.
The worker scripts and tests are under `deploy/codex-worker`.

The VM preparation sections below are dated operational records. Their successful
checks do not establish the currently running release or current authentication state.

## Prompt-cache reuse (2026-10-15)

Game requests now separate trusted reusable instructions from changing game data.
The CLI receives the common rules through `developer_instructions`; stage advice
and the game-data suffix are sent on stdin. Changing stages therefore preserves
the common message boundary. `include_environment_context=false` removes
irrelevant per-request temporary-directory metadata. In standard mode each request uses an
independent ephemeral session, its own legal-choice schema, disabled tools and
ChatGPT authentication. The later balanced session experiment below also enables
per-bot history for half of new games. No model answers or private game states are shared between bots.

The two configuration keys exist in the pinned Codex 0.159.2 source. Live local
cache experiments use Codex 0.160.0; this is not verification of a deployed worker.
No custom cache key or paid API transport is introduced. Cache reuse is handled
by Codex/OpenAI and may be zero on an individual request. Inspect recorded
`inputTokens`, `cachedTokens` and `outputTokens`; do not treat cached tokens as
free or convert their fraction directly into subscription-quota savings.

**Deploy the updated SSH worker before the backend.** The backend now sends an
optional `instructions` field, which older workers reject as an unknown field.
The new worker accepts old requests without it, allowing a worker-first rollout
and a backend rollback. Install the updated `deploy/codex-worker/worker.cjs` in
the worker image before enabling the updated backend; preserve the authentication
state, launcher restrictions and existing request slots. Verify a controlled
decision and its usage record after rollout. This repository change does not
deploy or verify production.

The local comparison and reproduction command are recorded in
[the cache evaluation](../docs/ai-evaluations/2026-10-15-prompt-cache/README.md).

## Prepare the VM (local mode)

Merge [compose-codex.fragment.yaml](compose-codex.fragment.yaml) into the existing
production Compose. Keep its application secrets, database volumes and network
settings. Use the backend image from the new release. Initially keep Codex disabled.

Create the persistent volume on the VM before applying the Compose:

```sh
docker volume create avalon-codex
```

This external volume survives normal Compose teardown. Do not delete it: it stores
ChatGPT credentials and refresh tokens. Never include it in an image, Git or logs.

## Sign in

Commands below must run from the production Compose directory with its usual
project name and Compose arguments. Replace `backend` if the service has another name.
The one-off login uses the same image and mounted volume as the backend; it does
not restart the running backend. Ensure the new image is selected first.

```sh
docker compose run --rm --no-deps backend sh -c 'umask 077; CODEX_HOME="$AI_CODEX_HOME" codex -c cli_auth_credentials_store="\"file\"" login --device-auth'
docker compose run --rm --no-deps backend sh -c 'CODEX_HOME="$AI_CODEX_HOME" codex login status'
```

The owner of the subscription opens the displayed OpenAI URL and enters the
one-time code. Enable device-code login in ChatGPT security settings if needed.
Do not send `auth.json` or tokens through chat.

After login, set `AI_CODEX_ENABLED: 'true'` and apply the backend service during
the deployment window. Recreating it disconnects games and requires the normal
production rollout procedure. The application continues to use `NODE_ENV=production`.

## Verify and roll back

Check `codex --version` and login status in the backend. In the administrator UI,
check model discovery and the weekly subscription limit before starting one
supervised Codex game. These discovery calls do not start a model turn.
Check that a non-administrator cannot create/manage games or inspect limits.
Model calls require outbound access to OpenAI; no additional inbound port is needed.

Disable new Codex access with `AI_CODEX_ENABLED=false` and recreate the backend
using the usual deployment procedure. Preserve the volume for subsequent login.
Stop any active Codex game before disabling or rolling back. Subscription limits
are shared with other use of the same ChatGPT account.

The runner uses a temporary working directory, disables tools and does not pass
backend credentials to the CLI. It forces ChatGPT authentication, never API-key
billing. Production deployment and a real model turn must be verified on the VM;
local mocked tests do not prove its authentication or network access.

Official references: [headless authentication](https://learn.chatgpt.com/docs/auth),
[non-interactive Codex](https://learn.chatgpt.com/docs/non-interactive-mode).

## VM preparation on 2026-10-01

On the current production VM, a separate `avalon-codex-bootstrap:0.159.2` image
was built from `razdva12/backend-avalon:v69.0.1` with the pinned CLI. Its Dockerfile
is in `~/avalon-codex/Dockerfile`. The external `avalon-codex` volume was created
and its root permissions set to 700. Production containers were not modified.

Device authentication failed: OpenAI returned HTTP 403 with
`unsupported_country_region_territory`. No login succeeded. Resolve supported
hosting before retrying authentication or enabling the production provider.
The bootstrap image is only a login/preparation helper; it does not contain the
new production opt-in application code and must not replace the backend image.

## Separate worker VM preparation

An isolated `avalon-codex:0.159.2` image was installed on the separately supplied
worker VM. Files live under `/opt/avalon-codex`; `state` is owned by UID 10001
with mode 700. `/opt/avalon-codex/run` invokes the CLI as that unprivileged UID
with 256 MiB memory, 0.5 CPU, 64 PIDs, dropped capabilities, no-new-privileges,
read-only root filesystem and a 64 MiB temporary filesystem. No ports are
published. It uses direct outbound access to OpenAI; VPN configuration, routing
and firewall rules were not edited. The image includes system CA certificates.

Device login on this VM was completed by the account owner; a fresh isolated
CLI invocation confirmed `Logged in using ChatGPT`.

## Production SSH bridge

The worker is provisioned under a dedicated `avalon-codex` system account. Its
root-owned `authorized_keys` permits only the production VM source IP and forces
`/opt/avalon-codex/ssh-entrypoint`. `restrict` disables PTY and forwarding.
The account is not in the Docker group. Its only passwordless sudo permission is
the root-owned `/opt/avalon-codex/worker-launch` with no arguments. Root/admin
SSH login and the VPN configuration were not changed.

The production private key was generated **on production** under
`/opt/avalon/codex-ssh/id_ed25519`; it was not copied to the repository or worker.
`known_hosts` beside it pins the verified worker Ed25519 host key. This directory
is root-owned and mode 700. No root password is used by the application.

The worker accepts bounded JSON on stdin for `decide`, `models`, or `limits`.
It sends JSON on stdout. The launcher uses two bounded flock slots for concurrent requests,
buffers each Docker result in a temporary root-only file, and sends whitespace
heartbeats directly over SSH while running. An SSH disconnect stops the launcher
and removes the container. Container creation completes synchronously before
the background attach client is started, so cancellation cannot leave a late
unregistered container behind. Cleanup also stops the Docker client. Metadata reads
can retry a busy worker. The backend retries a failed Codex decision request once
(local CLI failure, SSH failure, or worker `failed`). A second failure pauses the
match for manual retry. Busy workers, usage limits, timeouts, invalid replies, and
cancellation do not trigger an automatic decision retry. Update the worker before
enabling backend retry so its distinct nonretryable error codes are available.

The production VM successfully used its restricted key to retrieve the model
catalog and weekly quota. An arbitrary `id` command was denied. A live SSH
disconnect removed the worker container and freed the lock. Isolated Linux tests
also cover cancellation while container creation completes late.

### Enable remote mode during rollout

Merge [compose-codex-remote.fragment.yaml](compose-codex-remote.fragment.yaml)
into the Yandex Cloud production Compose and use the new backend image containing
the remote transport and OpenSSH client. Keep all existing secrets, mounts,
networks, UI and MongoDB configuration. The remote-worker configuration supersedes
the local Codex-auth volume fragment: ChatGPT credentials stay on the worker VM.
Keep `AI_CODEX_ENABLED=false` until the controlled rollout; then set it true.

At the recorded 2026-10-01 preparation, the `v69.0.1` backend did not implement
this SSH transport and was not restarted. This is historical evidence; check the
actual deployed image and configuration before rollout.
During rollout, check that no human or AI game is active before recreating backend.
Verify model selection and quota in the administrator UI, then start one supervised
game. A complete game and real model decisions remain rollout checks.

To disable the connection, set `AI_CODEX_ENABLED=false` and apply the normal
backend rollout. To revoke worker access immediately, remove only the dedicated
production key from `/home/avalon-codex/.ssh/authorized_keys`; existing root/admin
keys and VPN services remain independent. Preserve `state` for later login.

## Decision timeout recovery (2026-10-07)

A mixed five-seat production match paused at assassination after its SSH request
hit the 615-second transport deadline. The CLI wrapper had been killed at its
600-second deadline, but the native Codex descendant survived, holding stdout
open. The Node worker and launcher therefore remained alive and retained the
worker lock; later catalog reads returned `busy` without any newer game request.

The decision runner now starts the CLI in a separate POSIX process group and
kills that whole group on timeout, forbidden tool use, or excessive output. A
mock wrapper with a surviving descendant reproduced the hang before the fix;
regressions passed on macOS and in a network-isolated Linux container afterward.
The worker source was updated with a backup, the identified orphan container was
removed, and a production-backend catalog read succeeded. Game data and auth
state were preserved. The match stays technically paused until its administrator
uses the existing retry control; recovery did not generate a model decision.

A subsequent administrator retry also reached the decision timeout. This time
the worker container exited and released its lock, confirming process cleanup;
the reason Codex returned no decision remains unresolved. The worker now records
only the latest failure in `state/avalon-last-failure.json` (mode 600): timestamp,
elapsed time, a bounded reason, the last whitelisted event type, and a connection
or authentication classification. Diagnostics also include a whitelisted error category,
HTTP status (when detected), CLI exit code and selected model. It never stores prompts, replies, or raw CLI
diagnostics. Network-isolated Linux regressions passed before this worker update.

## Rate-limit diagnostics

The worker returns `rate_limit` for a failed CLI turn classified as HTTP 429 or
an explicit rate-limit error. The backend pauses the match with a wait/manual-retry
message instead of immediately starting another decision request. This changes
the application's retry behavior; the CLI may perform its own transport retries.
Install the updated worker before deploying the backend message change. The
previous backend already treats this new worker code as a nonretryable pause.

The same private `state/avalon-last-failure.json` now includes `rateLimit`:

- `kind`: `tokens`, `requests`, `concurrency`, `account_usage`, or `unknown`,
  derived only from explicit CLI error wording. `windowDurationSeconds`, numeric
  `limit`/`used`/`requested`, and `retryAfterSeconds` are included when recognized.
  Unsupported number formats or units are omitted rather than guessed.
- `quota`: a fresh read of `account/rateLimits/read`, with `checkedAt`,
  `status`, and up to 16 sanitized `buckets`. Each bucket contains its limit ID,
  primary/secondary usage percentage, window duration and reset timestamp,
  `rateLimitReachedType`, and `spendControlReached` when available. An unknown
  reason is marked `unknown`; an explicit upstream `null` remains `null`.
  Unavailable/invalid windows are omitted, while explicit null windows remain null.

The quota read starts only after a limit failure and does not generate a model
turn. It is bounded by the existing 15-second metadata timeout; failure to read
quotas preserves the original pause with `quota.status=unavailable`. Its whole
process group is stopped, including CLI descendants. Failure timestamp and elapsed
time describe the decision, excluding the subsequent metadata read.

The file remains mode 600 and stores no raw CLI message, prompt, model reply,
credential or account identifier. Its quota snapshot is account-state evidence:
an exhausted bucket does not establish that it caused this particular request's 429. If the upstream error provides no subtype, `kind=unknown` remains intentional.
Only the latest failure is retained across the two worker slots; correlate its
timestamp/model with `ai_request_costs` before attributing it to a room.

## Two-slot worker (2026-10-11)

The launcher retains a shared `worker.lock` plus exclusive `worker-slot-1.lock`
and `worker-slot-2.lock`. Older launchers hold the legacy lock exclusively, so
an atomic replacement waits for their request to finish before starting new slots.
A third request waits up to 30 seconds with SSH heartbeats; it does not dispatch
or repeat a model turn while waiting. Cancellation removes only its own container.

Docker must use the systemd cgroup driver and cgroup v2. Install
`deploy/codex-worker/avalon-codex.slice` root-owned as
`/etc/systemd/system/avalon-codex.slice`, run `systemctl daemon-reload`, and
`systemctl start avalon-codex.slice` **before** installing the new launcher.
Verify `systemctl show avalon-codex.slice` reports `MemoryMax=268435456`,
`CPUQuotaPerSecUSec=500ms`, `TasksMax=128` and `MemorySwapMax=0`.
Both containers use `--cgroup-parent=avalon-codex.slice`; their combined ceiling
is 256 MiB RAM, half of one CPU and 128 tasks, rather than two independent budgets.
Per-container limits remain 256 MiB/0.5 CPU and rise to 128 tasks.

Back up `/opt/avalon-codex/worker-launch` before an atomic root-owned replacement;
preserve the state/auth directory, forced-command SSH key and existing lock files.
Rollback restores that launcher: its exclusive legacy lock prevents overlap with
new requests still finishing. The slice may remain installed while old containers
finish outside it. Backend/UI activation must preserve the current production
configuration and wait for live games to finish.

The backend pairs only private team votes, mission cards and post-game reviews.
Discussion and Evil council remain sequential. Completed choices survive technical
pause; a failed pair cancels its pending peer before another pair starts. Reviews
publish in seat order with stable message IDs. Public thinking state supports two
seats, with a legacy single-seat fallback; secret mission generation never identifies
model-driven seats. Artificial message pacing is disabled.

## Balanced bot-session experiment (2026-10-15)

The game service now assigns started games globally 50/50 to `standard` and
`session-delta` under the existing global game lease. It counts durable assignments,
so a failed allocation cannot consume an invisible counter increment. With an odd
number of games one arm has one extra assignment. A game's assignment never changes
on a technical resume. Model, reasoning, language, difficulty, table size and human
count define comparison strata; allocation remains global rather than restarting
with standard mode for every new combination.

Session-delta uses a private native thread/profile for each bot and match. Only the
initial turn bootstraps the full state. Later turns send exact changed fields and
changed common/stage instructions. Both arms use fresh post-game reviews. Failed
native requests are not automatically retried; an explicitly resumed technical
pause bootstraps the affected bot in a new thread and records the reset. Rejected
output validation also invalidates that bot. Other bots retain their own histories.

Update `worker.cjs` **before** the backend. The backward-compatible worker accepts
`session: {key, id?}` on decisions and `closeSessions: {keys}` for cleanup; keys and
native IDs must be UUIDs, never paths or CLI options. The existing `/state` volume
contains `avalon-sessions/<key>`, mode 700, with an empty work directory and an auth
link to the existing login. Codex may replace its auth link when refreshing its own
profile; treat the entire session directory as credential-bearing private state.
Completion, manual stop and pause expiry remove owned profiles. Abandoned worker
profiles expire after seven inactive days when a later persistent request performs
GC. Backend crashes cannot restore in-memory BotRoom games; they remain visibly
incomplete in the experiment ledger. Never share or archive session profiles.

`ai_request_costs` records phase, actual model/reasoning, assigned experiment,
logical/submitted bytes, input/cache/output tokens, attempts, unknown usage and
session resets. Cumulative native session usage is subtracted between turns. A
failed attempt with unavailable usage remains explicitly unknown. A standard-mode
automatic retry records both attempts and unknown usage for the first. Private
full inputs/outputs remain in the existing traces with their 30-day retention.
Cost records retain the existing 365-day retention. `ai_session_experiments` stores
non-secret durable summaries and all sanitized quota buckets, independent of trace
TTL. Quota reads bypass the UI's 60-second cache. Paused/stopped games remain in the
report; they must not be silently discarded as expensive outliers.

Generate the private report inside the backend using its normal environment:

```sh
npx ts-node -P packages/backend/tsconfig.json -r tsconfig-paths/register packages/backend/src/scripts/reportBotSessions.ts
```

The report groups comparable settings and modes, exposes completed/paused/stopped/
incomplete counts, requests/tokens, retries/unknown usage, resets, votes/rejections,
mission counts and winning sides. Quota observations match bucket/window/reset;
unknown and reset windows do not become zero spending. All percentage changes are
coarse account-wide observations, potentially including other activity or pauses.
They are not exact per-game subscription charges or paid API costs. Five completed
games per mode within one comparison stratum trigger the initial-review indicator;
this is an exploratory checkpoint, not proof of equal quality or economic benefit.
