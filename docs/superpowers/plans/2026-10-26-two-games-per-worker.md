# Two games per worker implementation plan

**Goal:** Allow an explicitly configured account to host two games while sharing two request slots, 512 MiB RAM and one CPU.

**Design approved in chat:** Retain account identity and quota routing. Add optional `maxGames: 2` (default one), independent MongoDB lease documents per game slot, and a serialized admission lock in the existing worker launcher. Queue up to 600 seconds, then allow the existing 600-second decision deadline; SSH and lease deadlines cover both. Preserve auth, SSH restrictions, cancellation and existing games. Enable initially only on account-one; leave account-two at one game and its existing resource budget. No new dependency or service.

## Tasks

- [ ] Backend: write failing configuration, MongoDB concurrency, and full service allocation/dashboard regressions. Two games on one account must share quota identity, a third must fail, release/renew must affect only its owner, and another backend must observe both slots. Reject maxGames outside 1–2.
- [ ] Implement optional capacity, deduplicated occupancy by room, and bounded atomic slot leases preserving the original first-slot document. Dashboard must show all account rooms without marking a live sibling stopped. Extend SSH timeout to 1,215 seconds and lease to cover two failed transport attempts.
- [ ] Worker: test queued FIFO admission, cancellation and exactly two running requests; raise shared limits to 512 MiB/1CPU, two slots remain. Queue deadline 600 seconds with heartbeats. Do not retry a dispatched decision.
- [ ] Verify targeted suites, TypeScript, formatting and Linux launcher tests using fake Docker in an isolated container. Review changes for races, rollback and credential isolation.
- [ ] Operations: reconnect using the trusted management key; inspect live leases/containers, stage files with backups, and apply only after games drain. Preserve canonical Compose and normal release safeguards. Verify effective limits, capacity, read-only metadata and health. If application deployment cannot complete, report precisely what is active and what remains staged.

## Rulings and progress

- Existing package.json and package-lock.json modifications belong to the user and are excluded from the change.
- Resource headroom was measured live: 2 CPU, 1,967 MiB RAM, about 1,535 MiB available. Both original slices reached 256 MiB without OOM kills. HTTP 429 is a separate upstream failure and is not fixed by this work.

- Verified: full backend baseline 1,382 tests; final affected AI suite 800 tests; UI tests 644; Linux launcher 7/7; backend TypeScript and lint; Bots.vue template compilation. Local full UI build stalled in its worker processes and was stopped; pinned Linux CI remains the release gate.
- Independent review addressed shared quota overlap, paused/resumed games, abandoned historical rows, legacy dashboard leases, and renewal before queued post-run metadata.
- Applied first-worker resource/launcher update with root-only backup; live shared limits 536870912 bytes / 1 CPU / 256 tasks. Second worker unchanged. Backend capacity remains unchanged until release activation.
