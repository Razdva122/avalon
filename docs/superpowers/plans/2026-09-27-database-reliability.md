# Database reliability implementation plan

> Historical record: findings, measurements and plans describe their recorded date. For current setup and operations, use the [documentation index](../../README.md).

**Goal:** Correct all findings in `docs/database-audit-2026-09-27.md` without requiring a replica set or changing rating formulas.

**Architecture:** MongoDB standalone remains supported. A durable globally ordered operation queue stores an immutable rating plan before applying it. Each player update uses a revision compare-and-set; duplicate/stale workers cannot apply the same plan twice. A controller never advances until player updates and game achievements finish. Achievement sequence guards make retries safe. Role leaderboards publish immutable generations through an atomic pointer. Startup awaits migrations and indexes before listening.

**Constraints:** Preserve current user-facing contracts where possible. Do not connect to production, delete historical records, or deploy. Unique-index migrations preflight duplicates and stop with actionable diagnostics. Existing ambiguous partial ratings require operator-reviewed repair rather than guessed automated corrections.

- [x] Write failing regression tests for duplicate game-end, idempotent archive persistence, concurrent rating jobs, partial failure/restart and reset ordering.
- [x] Implement durable rating/reset operations, single transition end event, archive upsert and retrying completion worker.
- [x] Implement atomic achievements and sequence deduplication, indexed bounded sticker eligibility.
- [x] Publish role-rating generations atomically; normalize new history and stream archive projections; retain legacy read compatibility.
- [x] Await successful database bootstrap and versioned migrations; fix indexed recovery cleanup.
- [x] Compensate pre-dispatch AI reserves; bound ledger storage and configure trace retention.
- [x] Make backup consistency independent of ongoing application writes and verify cleanup on failures.
- [x] Bound player history reads using compatible pagination, improve global statistics and TrueSkill snapshots.
- [x] Run focused and full test suites, typecheck, lint/format touched files, independent code review; resolve findings.
- [x] Document deployment preflight, historical reconciliation and validation evidence.
