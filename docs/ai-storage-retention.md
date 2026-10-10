# AI ownership and diagnostic retention

[Documentation index](README.md)

Codex is the sole active provider. Its token usage and request diagnostics are
recorded without reserving or spending a RUB budget. An exclusive room lease
prevents simultaneous AI games and is renewed before model requests and during
human turns. The lease lasts twelve minutes, covering the ten-minute request timeout.
A claimant can take over only an expired/unowned lease or renew its own room.

For upgrade compatibility the lock still uses the existing `ai_experiment_budget`
document (`avalon-ai-production-v1` in production, `avalon-ai-v1` otherwise).
Only ownership and expiry fields are changed. Historical cost fields and the
`ai_room_budgets` / `ai_budget_periods` collections are left intact; the application
no longer reserves, settles, extends, archives or displays paid-provider budgets.
Do not run two backend releases concurrently during deployment.

Codex request logs retain the existing `ai_request_costs` collection name so prior
subscription diagnostics remain available. New/updated completed, failed or
cancelled requests with `finishedAt` receive `expiresAt`; in-flight records do not.

- `AI_TRACE_RETENTION_DAYS`: 30 days for private request/response traces.
- `AI_REQUEST_RETENTION_DAYS`: 365 days for finalized request logs.

Both settings accept whole days from 1 through 36500. They affect records written
by this release, not existing expiry timestamps. MongoDB TTL deletion is asynchronous.
Replay history, ratings, public chat and historical accounting have no new TTL.
Existing records without `expiresAt` remain intact. Any retroactive retention or
removal of old data requires a separate explicit operation and backup.

Archived games remain viewable. Generic model-label recovery strips private
project paths from old trace labels. Deleting traces may prevent recovery of
missing labels in very old replays; newer replays save their model directly.
