# Bot session experiment rollout

Use the existing BotRoom, prompt delta encoder, Mongo request ledger and SSH worker. Keep prior in-place work; no new dependencies.

1. Add tests for durable balanced allocation, remote native thread isolation/resume, cumulative token subtraction and experiment reporting.
2. Assign consecutive started games alternately to standard and session-delta modes, globally balanced, with analysis separated by model/reasoning/difficulty/table size/human count/language. Save the assignment privately before the first request; retain it across technical pauses. Reviews remain fresh in both arms.
3. Extend the worker with validated opaque session keys and native UUIDs. Use a separate private profile/work directory per bot, retain it between disposable containers, remove it at match termination and expire abandoned profiles. Keep disabled tools and bounded transport. Never automatically retry an ambiguous resumed turn; on an explicit technical resume reset the affected bot with a complete current snapshot and record the reset.
4. Persist uncached/cached/output tokens, exact submitted input bytes, status, phase, model, reasoning and mode per call. Save fresh weekly/short-window limit snapshots before the first call and after each run segment, including paused/stopped games. Account percentages are shared/coarse observations, not exact charges.
5. Provide a private database report script grouped by comparable game settings and mode, with completed/aborted/incomplete counts, quality proxies and quota reset handling. Preserve durable non-secret summaries independently of trace retention. Initial review after at least five completed games per arm is exploratory.
6. Run focused tests, AI regressions, type/lint checks and independent code review. Roll out worker before backend using existing release/deployment controls and verify health/accounting. Do not interrupt active games.
