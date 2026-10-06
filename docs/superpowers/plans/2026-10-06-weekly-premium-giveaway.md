# Weekly Premium Giveaway Implementation Plan

**Goal:** Ship the authorized weekly giveaway and optional party composition with reviewable local code and verification.
**Architecture:** Mongo-backed server scheduler and existing manual Premium grants; shared typed DTOs; small Vue components within current design.
**Tech Stack:** TypeScript, Express, Mongoose, Jest, Vue 3, existing UI node tests.
**Spec:** docs/superpowers/specs/2026-10-06-weekly-premium-giveaway-design.md

## Global Constraints

- Sunday 20:00 Asia/Yekaterinburg; party without explicit members awards its author.
- One solo listing and one party listing selected uniformly; each group has one ticket, then a uniform member choice.
- Only active, unmoderated, unexpired published listings and existing non-banned recipients without Premium; winners distinct.
- Existing manual Premium grant is lifetime and independent of payments; selection persists before retryable grants.
- Atomic unique draw claim, recoverable lease, no duplicate/random replacement winners on retry or multi-instance execution.
- Optional memberIDs remains backward compatible; registered users only, unique, max ten, within groupSize; no solo members.
- New UI text in all six locales, preserve prerender; no new dependencies and no production changes.

## Task 1: Backend members and reliable giveaway

Files: packages/types/player-board.ts, new packages/types/giveaway.ts; packages/backend/src/player-boards/{validation,repository,routes}.ts and their tests; new packages/backend/src/support/giveaway/{schedule,repository,service,worker}.ts and tests; packages/backend/src/support/routes.ts; packages/backend/src/index.ts; docs/player-boards.md; new docs/payments/weekly-giveaway.md.

- [x] Read the spec and existing Premium/manual grant consumers and Mongo test patterns.
- [x] Write failing behavioral tests for optional party members, limits/unknown accounts, bounded authenticated search, DTOs and backward compatibility. Run the focused tests and capture RED.
- [x] Add optional memberIDs to BoardDraft, normalized empty IDs to saved listings, optional members public DTO list. Authenticated GET /members?query= returns {members:[{userID,name,avatar}]} max ten results, minimum two characters, bounded query, escaped prefix name matching; use existing profile fields. Update projection and invalid_members error mapping.
- [x] Write failing scheduling/draw tests: Sunday boundary/date rollover, no pre-init backfill, expired/hidden/moderated/banned/missing profiles, already Premium (paid and granted), solo/group distinct winners, author fallback, equal group tickets regardless of composition, retry after grant failure, two concurrent processors, stale lease recovery, empty categories and public unauthenticated DTO privacy. Run and capture RED.
- [x] Implement schedule persistence and processing using the existing Mongo/native timer patterns. Native crypto RNG can be injected for deterministic tests. Register initialization/indexes and worker in backend startup after DB connection. Public GET /api/support/giveaway precedes authentication middleware and remains independent of crypto provider availability. Public result contract is in spec. No draw mutation HTTP endpoint.
- [x] Verify recipient rights immediately after grant with existing hasPremium consumers; avoid modifying donation totals or privacy settings.
- [x] Run backend suite and TypeScript; document rules, rollout and restart semantics, operational queries, constraints including inability to prove genuine recruiting intent. Self-review diff, commit this task, write report with RED/GREEN evidence.

## Task 2: UI composition, banner and winners

Files: packages/ui/src/pages/community/{BoardForm,BoardCard,PlayerBoards}.vue and board-helpers.ts; packages/ui/src/pages/lobby/Lobby.vue; packages/ui/src/pages/support/Support.vue, new Giveaway.vue; packages/ui/src/api/support.ts and player-boards.ts as needed; new packages/ui/src/i18n/langs/pages/giveaway.ts; packages/ui/src/i18n/langs/pages/playerBoards.ts; packages/ui/scripts/giveaway.test.cjs and existing board tests as needed.

- [x] Read spec and backend types, existing LocaleLink/profile routing and translation generator.
- [x] Write failing behavioral component/helper tests for old listings/edit projection, member add/remove/search, no duplicate IDs, group size limit and submission, safe optional DTO, winner/loading/empty/error rendering and linked routes. Run RED.
- [x] Add optional group members picker with debounced authenticated search, selected profile chips/removal, clear fallback explanation and validation. No lookup for solo or before sufficient characters; handle request races and unavailable search. Display members on group cards.
- [x] Add compact homepage giveaway banner with direct participation CTA and Sunday 20:00 UTC+5 timing. Add small clear giveaway eligibility notice to boards. Reuse a Giveway component on all actual Premium purchase pages; if Support is sole premium page do not invent additional routes. Show latest completed dated winners and group name, profile links, no fabricated winner for empty draws. Fetch public API without auth/payment dependency; retain loading/error/empty states.
- [x] Localize all copy in en/ru/es/pt/zh-CN/zh-TW using existing generation conventions. Rules disclose existing-Premium exclusion, live listings, party fallback, distinct recipients and two independent chances, plus no need to republish each week.
- [x] Run UI tests, locale generator, production build with all required SEO/bundle/startup checks. Self-review and commit, write report with RED/GREEN evidence.

## Task 3: Integration review and verification

- [x] Review the backend and UI contracts together; verify whole-branch diff against spec and any per-task review findings.
- [x] Run root suites once and focused checks for fixes. Run production UI build if not already verified on final tree.
- [x] Inspect local homepage, support and group UI in browser at desktop/mobile widths, including all result states through local fixtures only. Confirm links lead to actual profile and board routes, no horizontal overflow.
- [x] Complete final isolated code review and fix genuine defects, scoped re-review. Record test evidence and leave local branch ready to integrate with clear deployment status.

## Completion evidence

Backend: 77 suites / 771 tests passed on the integrated backend/UI tree. UI: 305 tests passed; complete production build and all SEO, hydration, bundle, image, support, startup, recovery and Web Vitals checks passed with the existing system Chrome override. TypeScript passed using the command-line rootDir override for the pre-existing cross-package test import. Both task reviews and the whole-branch review approved with no blocking findings.

Local browser QA covered roster lookup/add/remove/capacity and mobile width, homepage participation links, public dated winners and party names, missing category/first-draw states, API failure/retry, and group-card profile links. Only disposable fixtures were used.

The existing navigation fixture centers its real pointer target before clicking to avoid the fixed language suggestion overlay; application authentication is unchanged. The non-blocking deferred review suggestion is additional coverage of a live processor resuming after lease takeover; the current source ownership guards and idempotent grants were reviewed as correct.

No production push, deployment, actual draws or external messages were performed.
