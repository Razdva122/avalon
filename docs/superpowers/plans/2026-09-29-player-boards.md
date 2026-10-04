# Community Player Boards Implementation Plan

> Historical record: findings, measurements and plans describe their recorded date. For current setup and operations, use the [documentation index](../../README.md).

> Execute with subagent-driven-development, then verify integration in the same worktree.

**Goal:** Deliver both player boards on Community.
**Architecture:** Mongo persistence, authenticated Express API and shared DTOs, lazy-loaded Community UI.
**Tech Stack:** TypeScript, Express, Mongoose, Vue 3, Vuetify, vue-i18n.
**Spec:** docs/superpowers/specs/2026-09-29-player-boards-design.md

## Global Constraints

Preserve existing server directory. No free text or comments. All six locales. Never expose email/login/token in listings. No deployment. Existing unrelated growth-analysis document is outside this worktree.

### Task 1: API and persistence

Files: packages/types/player-board.ts, packages/backend/src/player-boards/{validation,repository,routes}.ts and tests; backend/src/index.ts.

- [x] Define shared DTOs exactly as spec and immutable allowlists. Import DTOs through @avalon/types/player-board (avoid changing barrel unless needed).
- [x] Write failing tests for 30-day expiry, seven-day bump and reactivation cooldown, edit stability, one listing per kind, completed-game gate, validation, owner/admin security, deduplicated reports and ban enforcement.
- [x] Implement validators and Mongo models with unique owner/kind, unique reporter/listing. Atomic findOneAndUpdate predicates for rank actions. Whitelist response projection and writes.
- [x] Mount router and initialize indexes on startup; use authenticatedUser Bearer tokens, existing room/profile models.
- [x] Run focused Jest integration tests and TypeScript checks. Review spec/security.

### Task 2: Community UI and localization

Files: packages/ui/src/pages/community/{PlayerBoards,BoardForm,BoardCard,BoardModeration}.vue as appropriate; packages/ui/src/api/player-boards.ts; packages/ui/src/i18n/langs/pages/playerBoards.ts and index.ts; Community.vue.

- [x] Add API client following support client base URL/auth behavior, shared DTOs.
- [x] Add test coverage for contact safety, lifecycle and timezone display helpers before implementing helpers.
- [x] Build both tabs with filter, pagination, publish/edit/hide/reactivate/bump controls, public-contact notice and explicit timezone, report action and admin panel. Use server eligibility and cooldown as authority; show API errors with localized messages.
- [x] Add six locales. Insert component before directory with existing styles/tokens. Retain community links.
- [x] Run UI tests and production compile; inspect desktop/mobile render if available.

### Task 3: Review and verification

- [x] Review actual API/UI integration and race conditions. Fix concrete issues.
- [x] Run full relevant test suites and production build. Record unrelated failures accurately.
- [x] Document API, validation and admin operations; deliver local worktree and test results.

## Verification record

Implementation and review completed in the attached player-boards worktree. Review identified and corrected explicit production indexes, Nginx proxy routing, and moderation transport-error localization. See docs/player-boards.md for operations and test coverage. Final full-suite results are recorded in the task delivery.
