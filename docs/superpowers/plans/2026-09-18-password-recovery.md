# Password Recovery Implementation Plan

**Goal:** Add opt-in Postbox password recovery without email verification.
**Architecture:** Atomic per-user Mongo outbox, shared sliding limits, SMTP worker, versioned sessions, Vue form.
**Tech Stack:** TypeScript, MongoDB, Express, Socket.IO, Vue/Vuetify, Nodemailer.
**Spec:** ../specs/2026-09-18-password-recovery-design.md

## Global constraints

No confirmation emails, no mass mail, legacy saved addresses eligible. Never send real mail from tests. Existing UI style and i18n conventions apply.

## 1. Recovery and durable outbox

Files: backend/src/recovery/{config,crypto,repository,service,mail,routes}.ts and recovery.test.ts.

Interfaces: `RecoveryService.request(email: string, ip: string, language: string): Promise<void>`; `reset(token: string, password: string, ip: string): Promise<string>` returns user ID; `deliverOne(): Promise<boolean>`; `MongoRecoveryRepository` owns atomic persistence. `createRecoveryRouter(service)` exposes request/reset/events.

- [x] Write integration tests against disposable MongoDB. Assertions: racing reset requests have one winner, old passwords no longer match, no more than allowed messages enter outbox, unknown and known addresses have equal public results, expiry and email changes invalidate links.
- [x] Run `npm run test --workspace=packages/backend -- --runInBand recovery` and observe missing-feature failures.
- [x] Implement atomic `$push` token/outbox creation and conditional `findOneAndUpdate` password/token consumption; counters use conditional atomic Mongo updates; SMTP uses TLS and fixed sender.
- [x] Rerun tests and verify encryption, suppression, retry bounds, production opt-in and test allowlist.

## 2. Session revocation

Files: types/user/index.ts, backend/src/{user/helpers,db/user,main/index,support/routes,index}.ts.

- [x] Test legacy version 0 accepted until first reset, current versions accepted, old versions rejected.
- [x] Add `authVersion` to issued JWT and stored users, database checks for HTTP and socket middleware, socket disconnect on revocation.
- [x] Whitelist registration fields so client cannot set authVersion/internal recovery state. Invalidate recovery tokens when email/password changes.
- [x] Run backend tests and TypeScript check.

## 3. User interface and deployment

Files: ui/src/pages/account/PasswordRecovery.vue, ui/src/components/user/{AuthModal,CredentialsModal}.vue, ui/src/i18n/langs/passwordRecovery.ts, ui/src/router/{index,paths}.js/ts, ui/const.js, ui/public/index.html, nginx.conf, backend/.env.example, docs/password-recovery.md.

- [x] Add neutral noindex recovery route, request and reset modes, pending/success/error feedback and password confirmation; fragment read/clear happens before analytics.
- [x] Add translated link from login and email help; add nginx API proxy, private-page headers, trusted proxy configuration and analytics exclusion.
- [x] Document Postbox setup, env keys, authenticated event bridge, suppression removal, metrics and rollback.
- [x] Run backend suite, UI suite, TypeScript and build; inspect form at mobile and desktop sizes without sending mail.
