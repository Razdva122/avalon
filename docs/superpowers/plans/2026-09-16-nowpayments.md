# NOWPayments Implementation Plan

**Goal:** Connect hosted USDT checkout to Avalon accounts and Premium.
**Architecture:** REST support router alongside Socket.IO, Mongo order ledger, signed IPN updates, derived Premium, localized support UI.
**Tech Stack:** TypeScript, Express, Mongoose, Vue 3, existing JWT.
**Spec:** docs/superpowers/specs/2026-09-16-nowpayments-design.md

## Global constraints

- Threshold $10 cumulative completed invoice value before fees; checkout paid in USDT.
- Server secrets only; no charges/deployment during development.
- No cosmetics advertised before implementation.

## Tasks

- [x] Protocol tests first: forged/tampered signatures, nested keys, incomplete states, currency/order/invoice/price mismatches, underpayments, URL validation.
- [x] Implement provider client with fixed API origin, request timeout, hosted URL validation, configurable USDT networks, signed IPN verification.
- [x] Implement indexed invoice ledger and service; tests exercise duplicate and reordered events, concurrent completion, public anonymity, unauthenticated requests. Use atomic conditional update rather than incrementing a cached total.
- [x] Add authenticated REST endpoints for checkout, personal history/reconciliation/privacy; public config/donations; signed webhook.
- [x] Add server-derived public badge, support page and lobby card with localization. Explain unavailable checkout, fee treatment and payment pending states.
- [x] Document secret configuration, merchant setup, reverse proxy, test/live separation and live smoke checklist.
- [x] Run targeted tests, full backend tests, TypeScript checks, UI build and review diff. Report what remains unverified without merchant credentials.

## Verification notes

- HTTP/provider/protocol/accounting tests and the full backend suite passed (117 tests).
- Final production UI build, localization policy, critical CSS, SEO and bundle checks passed after copy/layout refinement.
- Backend TypeScript has 55 pre-existing diagnostics in unchanged mocks. Baseline archive reproduced the identical set; no new diagnostics.
- Desktop/mobile support layout and lobby navigation checked in the browser. No horizontal overflow at 390 px. Local backend/MongoDB are unavailable, so live UI account/payment flows are not exercised here.
- Merchant credentials, three supported network codes and a real test payment/withdrawal are required before production activation. These are not marked complete by local tests.
