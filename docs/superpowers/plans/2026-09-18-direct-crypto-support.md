# Direct Crypto Support Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task in this session.

**Goal:** Accept arbitrary BTC and USDT transfers, verify txids and credit support exactly once.

**Architecture:** Read-only chain adapters feed a MongoDB-backed claim service. The existing support ledger remains the source of Premium and public donations. A leased worker checks pending claims; the Vue page submits and displays them.

**Tech Stack:** TypeScript, Express, MongoDB/Mongoose, Vue 3, Jest, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-18-direct-crypto-support-design.md`

## Global Constraints

- Four operator-provided mainnet addresses; arbitrary transferred amounts; no pre-payment invoice requirement.
- BTC: one confirmation (updated by the owner during implementation); EVM: finalized canonical block and successful receipt; TRON: successful solidified receipt.
- First verified claim wins; unique database index prevents double credit. Manual reassignment records a reason.
- USDT at $1; BTC at a fresh Coinbase BTC-USD ticker when processed; truncate to cents using integer arithmetic.
- Owner update: remove OxaPay entirely; it was never connected. No legacy reconciliation.
- No private keys, deployment or real transfers. Network requests only to built-in public providers or operator-configured overrides.

## Task 1: Configuration, validation and chain verification

Files: create `packages/backend/src/support/direct/{config,protocol,http,chains}.ts` and `chains.test.ts`.

Interfaces: `DirectNetwork`, `NetworkConfig`; `readTransfer(config, txid): Promise<TransferResult>` with pending/confirming/rejected/verified status and integer amount, block hash/height. `valueTransfer(config, amountAtomic): Promise<Valuation>` returns cents, rate and timestamp.

- [x] Write tests with captured-shape RPC fixtures: valid transfers, wrong token/address/chain, failed receipt, missing finality, reorg, decimal precision and stale pricing.
- [x] Run `npm run test --workspace=packages/backend -- --runInBand src/support/direct/chains.test.ts`; verify missing implementation failure.
- [x] Implement strict address/hash validation, fixed contracts, bounded HTTP reads and per-chain checks. Critical operation: `amountCents = Number(amountAtomic * priceScaled * 100n / (10n ** BigInt(decimals + priceDecimals)))`, with safe integer bound.
- [x] Re-run tests and verify all chain failure paths produce no credit.

## Task 2: Claim service, persistence and background worker

Files: modify `support/service.ts`, `support/repository.ts`; create `direct/service.ts`, `direct/worker.ts`, `direct/service.test.ts`.

Interfaces: `DirectService.submit(userID, network, txid, anonymous)`, `refresh(orderId, userID)`, `processOne()`, `reassign(orderId, expectedUserID, newUserID, reason)`; inject verifier and clock for deterministic tests.

- [x] Write real MongoDB tests racing claims from two users, retried submissions, restart/lease expiry, expired automatic retries, source-address snapshots, rates and ledger totals.
- [x] Run tests and verify missing feature failure.
- [x] Add optional chain metadata and audit fields; unique sparse `paymentID` remains the credit key. Complete via one conditional update: `updateOne({orderId, leaseToken, status: {$ne: 'finished'}}, {$set: {paymentID, status:'finished', amountCents}})`.
- [x] Add per-user submission/check cooldown, repeat-safe claim identity, persisted backoff and one-hour automatic deadline. Manual refresh can process expired claims.
- [x] Run database tests and confirm exactly one finished record and correct totals across races.

## Task 3: API and startup integration

Files: modify `support/routes.ts`, `src/index.ts`, existing `support/routes.test.ts`; keep the direct endpoints in the existing support router.

- [x] Test authenticated direct submissions and owner refresh with real HTTP and database; assert malformed hashes, duplicate claims and unavailable networks cannot grant credit; public feed excludes private metadata.
- [x] Remove OxaPay routes, adapter, tests and reconciliation script as requested by the owner.
- [x] Mount direct router behind existing authentication; expose public network metadata without RPC credentials; add only owner's chain metadata to `/me`.
- [x] Start worker after database indexes are initialized. `setTimeout` schedules another bounded batch after completion, avoiding overlapping runs.
- [x] Re-run all support tests.

## Task 4: Payment UI and translations

Files: modify `packages/ui/src/pages/support/{Support.vue,checkout.ts}`, `src/api/support.ts`, `src/i18n/langs/pages/support.ts`, `scripts/support-checkout.test.cjs`; add direct payment component test if supported by installed tools.

- [x] Test hash validation for all networks; verify atomic-unit formatting in backend tests and credited amounts in the browser.
- [x] Replace amount and redirect form with network select, copyable recipient, labeled txid field and anonymous checkbox; submit `/transfers` without client amount or owner.
- [x] Show saved/pending/completed/conflict states, network, crypto amount and server-valued USD in history. Remove obsolete provider links.
- [x] Update English, Russian, Spanish, Portuguese and both Chinese locales. Keep errors next to form and wrap long addresses on mobile.
- [x] Run UI tests, typecheck/build and inspect narrow/wide render when local preview is available.

## Task 5: Operator recovery and documentation

Files: create `packages/backend/src/scripts/reassignSupport.ts`, `docs/payments/direct-crypto.md`; remove OxaPay docs and spec status.

- [x] Test reassignment with invalid destination, empty reason, stale expected owner, repeated operation and preserved manual Premium.
- [x] Implement CLI using `DirectService.reassign` with explicit source/destination/reason, never sending funds. Save owner change and audit in same atomic update.
- [x] Document env settings including supplied addresses, provider limits, exact token contracts, BTC valuation time, worker recovery and staged production verification.
- [x] Run complete backend and UI tests, TypeScript checks, lint changed files, production UI build and `git diff --check`.
- [x] Review implementation against every spec section, report evidence and any environment limitations; do not deploy.

## Additional owner request: current mock interfaces

Updated game/player/action/chat fixtures to the current types and derive lobby rooms from the same game fixtures. Removed the backend test import of UI source; locale parity remains covered by the UI test suite. Backend TypeScript now checks without the previous 56 errors.
