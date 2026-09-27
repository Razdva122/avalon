# Security hardening — 27 September 2026

The September audit findings were addressed in application code and dependencies. Deployment is separate: these changes have not been applied to the running service.

## Application changes

- History translations render player names through Vue text slots (`i18n-t`), not `v-html`. This also makes previously stored HTML names safe in the updated UI.
- Socket subscriptions use disjoint `user:<id>` and `room:<id>` namespaces. Arrays, objects, prototype keys and malformed IDs are rejected before handlers run. Account registration assigns the public user ID on the server.
- Required acknowledgements are checked before database work. Error handling is installed before endpoint registration, catches returned promises and sends public error codes rather than internal exception messages. Rating/achievement query chains now return their promises.
- Password registration/changes validate length and UTF-8 byte size before bcrypt. Login preserves compatibility with old passwords, uses a uniform failure response and a dummy comparison for missing accounts. Password work, including recovery, is limited to four concurrent operations with no unbounded queue.
- Packet limits run before session database checks. Concurrent checks on one socket share a promise; successful authorization is not cached across subsequent packets, preserving immediate revocation checks.
- A normal room is retained for 30 minutes while waiting. Active games are rechecked every five minutes and retained until finished; expired rooms and their timers are removed. Maximum retained normal/AI room dictionary size for normal creation: 500; maximum active rooms hosted by one account: three. Only the host can request a restart.
- One socket can observe at most 20 rooms. Repeated join/leave requests do not corrupt online counters. Chat history and its retry cache retain the latest 1,000 messages, including stickers.
- Game votes accept only `approve`/`reject`, mission actions only `success`/`fail`, and custom timers require finite positive integer durations.
- Account, room creation, statistics and list interfaces handle error acknowledgements without treating errors as data. Profile names are updated after a successful acknowledgement. Failed public-profile lookups can be retried on the next lookup without creating a reactive retry loop.

## Request budgets

Limits are shared within the current backend process. Multiple independent backend instances would need a shared limiter before horizontal scaling.

| Operation                              | Budget                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| New Socket.IO connections              | 60/minute/IP                                                                         |
| All packets                            | 120/10 seconds/socket; 1,200/minute/IP; 600/minute/account; 5,000/10 seconds/process |
| Login                                  | 30/15 minutes/IP and 10/15 minutes/normalized login or email                         |
| Registration                           | 5/hour/IP                                                                            |
| Credential changes                     | 10/15 minutes/account                                                                |
| Statistics, game histories and AI list | 60/minute/IP combined                                                                |
| Room creation/restart                  | 10/minute/account                                                                    |
| Socket message size                    | 64 KiB                                                                               |

`TRUSTED_PROXY_CIDRS` must name only the actual reverse proxy addresses. Nginx now overwrites `X-Forwarded-For` for `/socket.io`; untrusted direct clients cannot select their rate-limit IP with a header. Without trusted proxy configuration, clients behind that proxy share its IP budget. Preserve the existing production value documented in `docs/environment.md`.

## Database work

- Full statistics use a 60-second cache and share concurrent calculations. Successful game saves invalidate the cache; each aggregate has a 10-second server-side time limit.
- Public AI room lists use a projected summary query, 15-second cache, concurrent request sharing and a creation-date index. Full replay loading remains separate.
- Added a normal room-ID index and an AI decision-trace room-ID index.
- Legacy `getPlayerGames` returns the most recent 100 full games. The current UI uses projected summaries; those remain complete to preserve lifetime statistics.
- ID validation is also enforced at database/repository boundaries.

Index creation and query plans still need observation on production-sized data. No production database or load test was run.

## Dependencies and deployment

Production dependency audit changed from 34 affected packages (2 critical, 21 high) to zero. The complete development tree changed from 82 to 16 (1 high, 15 moderate). These are npm package-level findings, including transitive findings, not distinct proven exploits.

Patched chains include Socket.IO/parser/ws, Vue I18n, Axios/form-data, bcrypt, Express, lodash and Mongoose/Typegoose. The supported database pair is now Mongoose 9 / Typegoose 13; database integration tests cover registration, password recovery and AI persistence. The application requires Node >=22.12. The UI build image is pinned to the verified Puppeteer 25 image digest; the browser fixture uses its updated click API.

The remaining high finding is PostCSS 7 in Vue CLI's legacy Vue 2 compatibility subtree. The active Vue 3 build uses patched PostCSS 8. It is a development dependency, not a production dependency. Removing that legacy subtree safely requires a build-system migration; it has not been hidden with an incompatible major-version override. Do not feed untrusted styles/source maps to that legacy tooling.

Rebuild and deploy backend and frontend together, retaining existing secrets and proxy configuration. Server-side channel names do not change the public room IDs or saved user IDs. Docker image metadata was verified; Docker itself was unavailable locally, so an actual Docker build was not performed.

## Verification

Regression tests cover stored-XSS rendering in all locales, malformed socket packets and acknowledgements, private subscriptions, room quotas/expiry, counter integrity, request budgets, trusted proxies, bcrypt concurrency, credential validation, cache invalidation, query limits and profile lookup retries.

Final verification on 27 September 2026:

- Backend: `npm test --workspace=packages/backend -- --runInBand --no-cache` — 49 suites, 359 tests passed.
- Backend TypeScript: `node_modules/.bin/tsc -p packages/backend/tsconfig.json --noEmit` — passed.
- UI: `npm run build:ui` with the installed Chrome executable — 165 tests passed, production build and all post-build checks passed. These include prerender/SEO, structured data/navigation, bundle and image budgets, password recovery, support and startup browser flows.
- `npm audit --omit=dev --json` — zero known production dependency vulnerabilities.
- `git diff --check` — passed.

The local dependency installation skipped install scripts, so the final UI build used `PUPPETEER_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'` (Chrome 154.0.8037.57). The pinned UI Docker image supplies its browser. Compilation still reports 18 warnings concerning the Vue hydration flag, CSS order and webpack size/runtime recommendations; project-specific bundle budgets pass.

Audit artifacts remain in `output/security-audit-2026-09-27/` locally; the original reproduction script documents the pre-fix state and is not a post-fix safety check. Production deployment, production query-plan inspection and load testing remain separate operational steps.
