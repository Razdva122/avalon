# AI dialogue and discussion languages implementation plan

> Historical record: findings, measurements and plans describe their recorded date. For current setup and operations, use the [documentation index](../../README.md).

> **For agentic workers:** Use subagent-driven-development and dispatching-parallel-agents for the independent room, interface, and prompt tasks. Track verified steps below.

**Goal:** Make AI conversations more interactive and expressive, add the two agreed reasoning checks, and allow English, Russian, or Traditional Chinese (Taiwan) discussion.

**Architecture:** Store an optional `AiLanguage` on each AI room and pass it to every bot request. Existing rooms and legacy socket calls default to English. A small server text catalogue handles generated announcements and claims; prompt instructions select the same language while JSON keys and legal choices keep their current format.

**Tech Stack:** Existing TypeScript, Socket.IO, Vue 3, Jest, and Node test runner; no new dependencies.

**Spec:** User-approved design in this chat: addressed questions/answers, existing character personalities, Merlin authorship tie-breaker, assassination candidate/evidence check, and room language `en`, `ru`, or `zh-tw`.

## Global constraints

- No extra discussion or voting rounds, new game rules, viewer polls, deployment, or paid AI runs.
- Preserve private/public prompt isolation and legacy creation/replay compatibility.
- Use two short public sentences at most; personality must not override legal choices, secrecy, or evidence.
- Traditional Chinese output must use Taiwan vocabulary and Traditional characters.

### Task 1: Room language and announcements

**Files:** `packages/types/room/index.ts`, `packages/types/api/sockets.ts`, `packages/backend/src/ai/service.ts`, `packages/backend/src/ai/room.ts`, their existing Jest tests.

**Interfaces:** Export `AiLanguage = 'en' | 'ru' | 'zh-tw'`; add optional `AiRoomState.language`; accept `createAiRoom(string | { model: string; language: AiLanguage }, callback)`; append optional language to `BotRoom` constructor. Every `BotRequest` receives that room language. Consume `aiText(language)`, `isVoteOnly(text)`, and `isAfterGameSpeech(text)` from `ai/language.ts`.

- [x] Add and run failing room/service tests for supported languages, invalid input rejected before claiming budget, and legacy English creation.
- [x] Validate creation options, persist language, propagate it to bot requests, and localize votes, inspections, council reveal, and postgame prefixes. Filter vote-only and after-game messages in all three languages.
- [x] Run room/service tests and confirm old English behavior stays valid.

### Task 2: Creation interface

**Files:** `packages/ui/src/pages/lobby/AiRoomButton.vue`, `packages/ui/src/components/view/panels/AiRoomPanel.vue`, `packages/ui/src/i18n/langs/*/aiArena.ts`, a focused UI runtime test.

**Interfaces:** Send `createAiRoom({ model: selectedModel, language: selectedLanguage })`; show the saved room language, defaulting missing values to English. Native option labels: English, Русский, 繁體中文（台灣）.

- [x] Add and run a failing interaction test verifying the selected language reaches the creation request and opening an active room bypasses creation.
- [x] Add a visibly labelled native select using existing form styling and a language indicator in the room panel. Keep the existing model default and English discussion default.
- [x] Run focused UI tests and type/build validation.

### Task 3: Prompt behavior and localized public text

**Files:** `packages/backend/src/ai/language.ts`, `client.ts`, `pipeline.ts`, `claims.ts`, `table-policy.ts`, their tests, and `docs/ai-rooms.md`.

**Interfaces:** Add optional `BotRequest.language`; `languageInstruction(language)` returns strict output-language instruction. `aiText(language)` provides `ready`, `postGamePrefix`, `councilPrefix`, `vote(choice)`, `inspection(seat, good)`, `council(target, reason)`. Localize enforced claims and mission-failure statements while retaining canonical structured claim fields.

- [x] Add and run failing tests for language-specific model requests, localized claims and claim history parsing, multilingual secret-role rejection/fallback, and unchanged public context isolation.
- [x] Allow a relevant direct answer or question with a concrete argument, at most two short sentences. Express the existing personality through compromise, questioning, trust, decisive facts, or concrete bets without invented events.
- [x] Add the short Merlin tie-breaker and assassination evidence/candidate checks, keeping decisions legal and role-private.
- [x] Implement the text catalogue, localized speech validation/fallback and claim parsing. Update AI room documentation.
- [x] Run focused prompt/claim/policy tests.

### Task 4: Integration and review

- [x] Run all backend AI Jest tests (192 passed) and backend TypeScript checking (`--rootDir .` for the existing cross-package test import), UI tests (284 passed) and production compilation (passed with CSS ordering and Vue configuration warnings).
- [x] Review the integrated diff for compatibility, privacy, locale correctness, and unchanged phase flow; resolve actionable findings.
- [x] Report verified behavior and any remaining verification limitations without claiming actual AI gameplay outcomes from mocked tests.

Verification uses mock model responses and a temporary local MongoDB. Live model language compliance and conversational quality remain to be observed in subsequent games. No deployment or live AI game was performed.
