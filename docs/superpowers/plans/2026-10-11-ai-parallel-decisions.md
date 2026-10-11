# Two concurrent AI decisions

**Goal:** Run private team votes, mission cards and post-game reviews with at most two concurrent model requests, including visible thinking indicators for both public seats.

**Approved design:** User approved implementation and worker configuration in chat on 2026-10-11. Discussion and Evil council remain sequential. Mission computation must not reveal which seats need a model. One game still owns the shared account lease. Remove the previously discussed artificial message delay.

**Architecture:** Process decisions in pairs; retain completed results before any checkpoint can fail. Wait for both requests to settle before pausing, applying private actions or starting another pair. Generate reviews concurrently and publish in seat order with stable publication IDs. Expose an array of thinking seats with legacy single-seat compatibility. The remote launcher uses two slot locks behind a shared legacy lock and a systemd slice enforcing a total 256 MiB/0.5 CPU/128 tasks budget.

**Files:** `packages/backend/src/ai/room.ts`, its tests, `service.ts`, `packages/types/room/index.ts`, `packages/ui/src/components/view/board/Board.vue`, UI integration tests, `deploy/codex-worker/launch.sh`, launcher tests, new `avalon-codex.slice`, AI and worker documentation.

- [x] Add failing tests for paired votes/cards/reviews, sequential speech, thinking indicators, privacy, failure/resume and cancellation.
- [x] Implement paired execution, pending results, ordered review publication and public thinking array; remove service pacing.
- [x] Add a failing Linux launcher test: two requests enter, third waits, legacy exclusive lock blocks entry, cancellation frees slots.
- [x] Implement two-slot launcher and aggregate systemd resource slice; retain heartbeat/cancellation and wait bounds.
- [x] Run backend AI tests, UI integration tests, type checks and isolated Linux launcher/worker regressions. Request independent review and resolve findings.
- [x] Inspect production release status, install worker configuration atomically with backup, verify concurrent real requests and cleanup. Prepare and verify the current backend and UI for the user's normal release; application activation occurs with that release.

**Validation:** No more than two calls active per room; no action from a partial private batch; completed decisions survive checkpoint failures; reviews retain seat order and are not regenerated after publication failure; no mission-role timing indicator; thinking stops after cancellation/pause/replay. Live worker must retain strict forced-command access and original auth state.

**Verified results:** Current workspace: 85 backend suites / 840 tests passed, 436 UI tests passed, backend TypeScript check and full production UI build passed. Isolated Linux launcher/worker: 11 tests passed. Independent review reported no actionable findings. Two real requests through the installed worker completed in 16.39 and 15.79 seconds, with aggregate peak memory 175.95 MiB and 89 tasks, no resource-limit events, and no remaining worker containers. Production currently uses standard v71.2.0 images; its mail and configuration sources match the workspace, so no separate mail patch is required for release.
