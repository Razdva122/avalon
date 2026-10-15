# Website bot-session A/B rollout

Release candidate: v73.2.0. The game service globally balances `standard` and
`session-delta` assignments, fixes the assignment per match, and keeps end reviews
fresh in both arms. The separate worker was updated first on 2026-10-15.

`worker-verification.json` records two short native calls through the actual
resource-limited SSH worker on Codex 0.159.2 / gpt-6.1-sol low. The second call
resumed the exact native thread and recalled a randomly chosen word that was not
repeated in the second input. Its usage is the difference from the first native
cumulative total. Both profiles/rollouts and temporary credentials were removed
with closeSessions. This verification is outside the game samples and must not be
counted as a game or as free rollout overhead.

Game assignments, sanitized quota snapshots and durable summaries live privately
in `ai_session_experiments`. Per-call usage remains in `ai_request_costs`, raw
private inputs/outputs in `ai_decision_traces`. No credentials, private profiles or
human game transcripts belong in this report directory.

The private report command and measurement limits are described in
[the worker deployment guide](../../../deploy/codex-production.md#balanced-bot-session-experiment-2026-10-15).
Initial analysis starts after at least five completed matches per mode within one
settings stratum; check failed, stopped, paused and incomplete matches too.

This file's release-candidate status is not confirmation of backend activation.
Record the deployment receipt and post-rollout health check before claiming live
A/B allocation is enabled.
