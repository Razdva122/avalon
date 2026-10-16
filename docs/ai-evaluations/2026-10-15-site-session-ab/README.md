# Website bot-session A/B rollout

Activated release: v73.2.1 on 2026-10-15. The game service globally balances `standard` and
`session-delta` assignments, fixes the assignment per match, and keeps end reviews
fresh in both arms. The separate worker was updated first on 2026-10-15.

Worker verification used two short native calls through the actual
resource-limited SSH worker on Codex 0.159.2 / gpt-6.1-sol low. The second call
resumed the exact native thread and recalled a randomly chosen word that was not
repeated in the second input. Its usage is the difference from the first native
cumulative total. The profile, rollouts and temporary authentication link were removed
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

[Production deployment succeeded](https://github.com/Razdva122/avalon/actions/runs/38725512515)
after both release images passed publication. The operator explicitly authorized
resetting unfinished rooms. Server health checks and an external HTTPS request
passed. The release check confirmed the running backend version, A/B router,
MongoDB access and worker quota windows (300 and 10080 minutes). At that check no
new experiment game had started; the empty ledger is the initial baseline, not a
measurement of zero-cost games. Future game costs are recorded privately in MongoDB.

## Release verification

- 519 backend AI tests passed (38 suites), including live-site request routing,
  per-bot reset/isolation, durable allocation, quota sanitation and summaries.
- 23 worker tests passed. Five unchanged launcher tests require Linux and were
  skipped locally. Two real resource-limited worker calls verified native resume
  and cumulative usage subtraction; their usage is stored separately above.
- 536 UI tests and the complete production/prerender/browser-check pipeline passed.
  v73.2.0 published its backend image but its UI failed an existing route budget by
  147 bytes after previously committed Vietnamese framework translations entered
  every language's startup bundle. The v73.2.1 fix loads that dictionary only for
  Vietnamese, awaits it before mount/prerender and preserves the existing budgets.
  Initial JS is 263.1 KiB gzip versus 265.8 KiB in the failed candidate.
- Backend TypeScript, changed-file ESLint, Prettier and diff checks passed. Whole-AI
  ESLint still reports two pre-existing unused `kind` parameters in room.test.ts;
  that file is unchanged. Independent code review found no remaining blockers.

One-off verification JSON exports were removed during YAGNI cleanup on 16 October 2026. The rollout findings above and the private database ledger remain the operational record.
