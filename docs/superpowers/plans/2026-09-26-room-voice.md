# Room voice beta implementation plan

**Goal:** Ship an optional LiveKit voice room for seated players and site administrators, with local audio controls and a Yandex Cloud deployment runbook.
**Spec:** ../specs/2026-09-26-room-voice-design.md
**Architecture:** An authenticated Socket.IO service owns voice admissions. A dedicated signaling gateway validates every LiveKit connection against current admissions; private LiveKit handles media. Vue lazily loads the audio client.
**Tech stack:** TypeScript, Vue 3, LiveKit JS/server SDK, Node HTTP/WebSocket, Docker Compose.

## Constraints and interfaces

Default disabled. No cameras, recording, data publishing or hidden administrators. No secrets in browser/logs. Server checks seats and DB administrator role. One voice session per account. Revocation invalidates admission before removal. Deployment remains disabled until real media security smoke checks pass.

Socket contracts: `getVoiceState(roomID, cb)` returns `{available, enabled, canJoin, canManage}` or `{error}`; `setVoiceEnabled(roomID, boolean, cb)` returns the same; `joinVoice(roomID, cb)` returns `{url, token, sessionID}` or `{error}`; `leaveVoice(sessionID, cb)` returns `true` or `{error}`. `voiceStateChanged(roomID)` triggers state refresh; `voiceRevoked(sessionID)` disconnects local media. Errors: unavailable, forbidden, rateLimited, invalidRequest. LiveKit identity is session UUID, metadata contains only account UUID; display names resolved through existing public profile API.

## Task 1: Admission service and signaling gateway

Files: packages/backend/src/voice/{config,service,gateway}.ts and tests; packages/types/voice.ts; packages/types/api/sockets.ts; packages/backend/src/{main/index,index}.ts.

- [x] Write failing behavioral tests for seat/admin/guest/other room/disabled matrix, old and refreshed JWT replay, revocation races, replacement, rate limiting and gateway routes.
- [x] Implement minimal service and actual HTTP/WS gateway; inject media API adapter for unit testing, use real SDK JWTs.
- [x] Wire room lifecycle, session revocation and private standalone gateway listener. Revalidate active admissions; fail closed on backend policy failure.
- [x] Run focused Jest and backend typecheck.

## Task 2: Voice UI and audio lifecycle

Files: packages/ui/src/components/voice/VoicePanel.vue; packages/ui/src/helpers/composables/useRoomVoice.ts; packages/ui/src/pages/room/Room.vue; locale files and scripts/room-voice.test.cjs.

- [x] Test late join cleanup, microphone lifecycle, independent gains/mutes and room replacement using a small injectable client adapter.
- [x] Add beta room toggle, explicit join/mic controls, visible participants, master and per-account volume/mute, errors and reconnect states.
- [x] Lazy-load SDK and stop all tracks on disconnect/unmount/revocation. Reconnect only after fresh server admission, never enable microphone in a different room automatically.
- [x] Run UI tests and production build.

## Task 3: Deployment and real contract validation

Files: deploy/voice/ and docs/voice-chat.md; backend .env.example and docs/environment.md.

- [x] Pin server image, private signaling listener, TLS/TURN/firewall guidance, secrets templates and enable switch.
- [x] Provide executable smoke test for real LiveKit, replay revocation and forbidden publishing; run locally if runtime available.
- [x] Document separate billing resource grouping and 3–5 day cost report, without a recurring automation or hard budget cutoff.
- [x] Validate configs and report any external deployment checks that cannot run locally.

## Task 4: Review and verification

- [x] Review all changed files for security boundaries, async races and cleanup; resolve findings.
- [x] Run applicable backend/UI suites, typechecks and formatting; record environment limitations accurately.
- [x] Deliver implementation, deployment prerequisites and exact validation evidence. No production deployment without infrastructure access.

## Execution ledger

- Worktree: codex/room-voice-beta, based on d215cf51. UI and infrastructure have disjoint ownership; backend/shared contracts owned by primary agent.
- Ruling: use dedicated gateway listener to avoid competing with Socket.IO upgrade handlers. Only documented RTC endpoints are forwarded; all other paths denied.
- Ruling: no Docker/Go/LiveKit executable present initially; prepare real-server test harness and investigate a vendor binary for local validation.

## Verification record

- Backend: 41 suites, 316 tests pass; backend TypeScript check passes.
- UI: 71 tests pass; full `npm run build:ui` passes including asset, bundle, SEO and existing browser checks. Build emits existing CSS ordering/size warnings.
- Real LiveKit v1.13.7: two Chromium clients exchange audio through the actual admission gateway; camera/data denied; revocation ends media; original, re-signed and actual SDK-refreshed JWT replay denied. Repeatable harness: `deploy/voice/real-gateway-smoke.cjs`.
- Review fixes: scoped pending admissions replace global revision; nginx limits by client IP, gateway by verified session; startup clears stale dedicated LiveKit rooms before readiness; RTC access/error logs suppress token-bearing URLs.
- A media-VM watchdog is required to bound loss-of-control failures. Startup/recovery procedures intentionally stop voice rather than leave orphaned media running.
- Production not deployed. External DNS/TLS, VPC rules, TURN fallback, mobile-browser checks and actual VM watchdog stop timing require the target Yandex Cloud environment; runbook keeps public beta disabled until these pass.
- Dependency audit: new direct LiveKit/WS dependencies had no reported advisory in this run. Existing transitive project dependencies have advisories; no broad unrelated upgrade was performed.
- Isolated branch retained for review; no push or merge performed.
