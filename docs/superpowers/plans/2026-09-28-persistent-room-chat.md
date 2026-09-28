# Persistent room chat implementation plan

**Goal:** Keep text and sticker conversations available after room archival and server restarts.

**Approved scope:** The chat portion of the design discussed on 2026-09-28. Game snapshots and game recovery are deferred.

**Architecture:** Store messages in a separate MongoDB collection. A chat service resolves either a live room or an existing archive, imports legacy embedded history idempotently, and persists before broadcasting or acknowledging. Existing roomUpdated events deliver history without exposing private game state. Keep the existing 1000-message display window; durable storage retains older messages.

**Constraints:** Authenticated users must have joined the room before sending; guests retain read access. Preserve sticker authorization and cooldown. Never acknowledge a failed database write. Deduplicate text retries across service restarts by room, author and request ID. AI speech uses the same persistence path. No new dependencies.

## Tasks

- [x] Add failing MongoDB integration tests for restart survival, concurrent retries, legacy import, archive sending, denied access and failed writes.
- [x] Implement room/chat-repository.ts with deterministic document IDs, bounded indexed reads and idempotent legacy import; register the read index in database migrations.
- [x] Implement room/chat-service.ts with per-room operation ordering, text/sticker persistence and live/archive broadcasts; update chat endpoints and bot speech.
- [x] Route sticker delivery through the service and await delivery before acknowledgement/cooldown.
- [x] Load durable history when joining and keep completed pages open when their live room expires. Rejoin on reconnect.
- [x] Run targeted backend and UI tests, TypeScript checks and lint/format validation; review the diff for authorization, races and error handling.

## Verification scenarios

Run backend Jest with --runInBand for room/chat*.test.ts, main/security.test.ts, stickers tests and database migrations. Use mongodb-memory-server integration tests to assert stored history through a fresh repository/service instance. Exercise a failed insert and ensure neither a success reply nor a broadcast appears. Test retries from two writers with the same request ID and preserve separate authors/rooms. Test text and sticker sends to an archived room without a live Room. Run backend tsc --noEmit and existing UI scripts.

## Completed verification

- Backend targeted regression suite: 9 suites, 64 tests passed, including real temporary MongoDB.
- UI suite: 189 tests passed.
- Backend TypeScript and standalone room-session TypeScript checks passed.
- Vue CLI development build passed (output in /private/tmp/avalon-chat-ui-build). Plain UI tsc cannot resolve the project's Vue SFC imports; the Vue build was used for component verification.
- Changed production TypeScript lint, formatting checks and git diff --check passed.
- Independent review found and verified fixes for stale join state and replay-position resets. Chat-only roomUpdated payloads update messages without rebuilding the game view; the optional wire argument preserves compatibility with older clients.
- No deployment, game-state snapshots or recovery implementation was performed.
