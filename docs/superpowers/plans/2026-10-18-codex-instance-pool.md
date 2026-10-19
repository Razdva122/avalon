# Codex instance pool implementation plan

**Goal:** Run up to one AI match per configured ChatGPT instance; allocate the free eligible instance with the greatest remaining five-hour quota, breaking ties by weekly quota.

**Approved behavior:** Reserve at preparation, pin for the entire match and pauses, release on completion/cancellation/timeout. Keep model settings, quota thresholds, player access and Premium rules. Preserve legacy single-instance configuration.

**Architecture:** Add validated server-only `AI_CODEX_INSTANCES` configuration and asynchronous request context, so each room uses its own local profile or existing SSH worker transport without changing process environment. Store independent MongoDB leases per instance, retaining the legacy default lease. Aggregate availability over free instances; scope room control locks by room and allocation locks by creator.

**Tech stack:** Existing TypeScript, Node AsyncLocalStorage, MongoDB atomic updates, Jest.

- [x] Add regression tests for independent leases, concurrent allocation, highest quota selection and pinned model/decision routing; run them against current behavior.
- [x] Add instance configuration/context and separate quota/catalog caches per connection. Route independent model calls through the pinned context.
- [x] Replace the single database lease with per-instance leases and preserve owner checks and lease expiry.
- [x] Replace global service locks with per-room control and per-user allocation locks. Aggregate free-instance availability and reserve/release consistently across preparation, start, technical resume and stop. Prevent beginner analysis from spending on a reserved instance.
- [x] Document local and remote configuration, one distinct account per instance, capacity, ranking and deployment without overlapping old/new backends.
- [x] Run affected AI tests, worker tests, TypeScript and lint. Request focused code review, resolve findings and verify final changes.

Execution is authorized in the current chat and will proceed inline in the existing workspace.

Validation: 43 AI suites / 586 tests passed; 23 worker tests passed; ESLint passed for changed TypeScript; TypeScript passed with `--rootDir .` (the existing backend tests import a UI helper outside the configured backend rootDir). Focused independent review completed and findings resolved.
