# Development guide

[Documentation index](README.md) · [Project overview](../README.md)

## Setup

Use Node.js >=22.12.0 and npm. Install from the repository root with `npm ci`.
Dependencies are shared through npm workspaces; do not install each package separately.
`npm run dev` starts local MongoDB/mongo-express and the two application processes.
See the [root quick start](../README.md#local-development) for the Compose v2 alternative.

The UI defaults to port 8080 and backend to 3000. Backend development CORS accepts
HTTP localhost, 127.0.0.1 and IPv6 loopback origins on other ports too. To start a
UI on another port with a separately running backend:

```sh
npm run serve --workspace=packages/ui -- --host 127.0.0.1 --port 8082
npm run dev --workspace=packages/backend
```

Run those two commands in separate terminals. Environment paths are relative to
`packages/backend`; workspace scripts select that directory automatically.
Development loads `.env.local` before `.env.development`; process environment wins.
Production ignores `.env.local`. Full setup: [environment guide](environment.md).

## Verification

Choose checks matching the changed behavior:

```sh
npm run test --workspace=packages/backend -- --runInBand
npm test --workspace=packages/ui
npx tsc --noEmit -p packages/backend/tsconfig.json
npm run lint --workspace=packages/backend
npm run build:ui
```

UI tests use Node's test runner and do not need `dist`. Production builds generate
avatar previews and locale dictionaries, run UI tests, build/prerender, inline
critical CSS and validate SEO, navigation, bundles, images, recovery, support,
startup and Web Vitals instrumentation. A build does not prove live performance
or external service availability.

For a single backend suite:

```sh
npm run test --workspace=packages/backend -- --runInBand src/ai/discussion-flow.test.ts
```

Backend integration tests use temporary MongoDB. If downloading a binary is not
possible, point `MONGOMS_SYSTEM_BINARY` at a compatible installed `mongod`.
If Puppeteer's browser is unavailable, set `PUPPETEER_EXECUTABLE_PATH` to an
installed Chromium/Chrome executable before running UI production checks.
On macOS, a typical value is `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.

Additional infrastructure checks:

```sh
node --test .github/tests/*.test.cjs
node --test deploy/nginx/*.test.cjs
node --test deploy/codex-worker/*.test.cjs
node --test deploy/postbox-events/*.test.cjs
```

Nginx checks require a local nginx executable and temporary loopback listeners.
Live HTTP checks are documented in [SEO](../packages/ui/SEO.md).

## Generated files and assets

Edit translations in `packages/ui/src/i18n/langs`, not `src/i18n/generated`.
`node packages/ui/scripts/generate-locales.cjs` prepares dictionaries when invoking
TypeScript/webpack outside npm's serve/build lifecycle.
Edit original artwork, not generated `src/assets/avatars` or thumbnails.
See [UI image preparation and publication](../packages/ui/README.md).

## Common failures

| Symptom                                 | Check                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| `docker-compose: command not found`     | Use the Compose v2 quick-start commands                                          |
| Backend exits before opening port 3000  | MongoDB availability, credentials and migration diagnostics                      |
| Missing locale JSON on a clean checkout | Generate dictionaries or use normal serve/build scripts                          |
| AI controls absent                      | Feature flag, configured provider and database `isAdmin: true`                   |
| AI game pauses                          | Admin pause reason, budget reservation, provider access and technical call limit |
| Board API returns HTML in production    | Effective mounted nginx configuration; see deployment guide                      |
| Recovery unavailable                    | `MAIL_ENABLED` and all required mail settings                                    |

Never publish local environment files, database exports, login credentials or SSH
keys. `npm version` is a release operation here: its lifecycle runs tests, updates
workspace versions, stages files and pushes commits/tags. Use it only for a deliberate release.
