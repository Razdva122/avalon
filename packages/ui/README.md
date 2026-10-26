# @avalon/ui

This workspace contains the Avalon browser UI, built with Vue 3, Vue Router, Vuetify, Vuex and vue-i18n. Install dependencies and run the commands below from the monorepo root.

[Documentation index](../../docs/README.md) · [Development guide](../../docs/development.md) · [Release guide](../../deploy/README.md).

## Project Structure

- **api**: Contains all the logic for backend communication.
- **assets**: Houses static files such as images, icons, and global stylesheets.
- **components**: All reusable Vue components are stored here.
- **helpers**: Utility functions and common methods that can be used across components to perform various tasks. These could include date formatting, number manipulation, or custom logic.
- **pages**: Represents the application's pages. Each Vue file here corresponds to a route in the application, consisting of one or more components put together to form a complete page.
- **router**: This directory contains the Vue Router configurations, defining routes and linking them to the respective pages/components in the application.
- **store**: Contains the Vuex store, modules, and configurations. It's used for managing global state across the application.

## Technologies

- [Vue 3](https://vuejs.org/): The progressive JavaScript framework for building user interfaces.
- [Vuetify](https://vuetifyjs.com): A Vue UI Library with beautifully handcrafted Material Components.
- [Vuex](https://vuex.vuejs.org/): State management pattern + library for Vue.js applications.

## Getting Started

**Install dependencies:**

```
npm ci
```

**Compiles and hot-reloads for development:**

```
npm run serve --workspace=packages/ui
```

**Compiles and minifies for production:**

```
npm run build:ui
```

## Tests

From the repository root, `npm test` runs backend and UI tests. To run only the UI
suite, use `npm test --workspace=packages/ui`; it does not require a built `dist`.
For one file, run `node --test packages/ui/scripts/user-stats-loading.test.cjs`.

Keep tests for game rules, payment integrity and access control, failed requests,
and concurrent updates. Avoid tests that merely mirror constants, mock call chains,
or cosmetic details. The production build runs UI tests and then `check:build`
against the generated HTML, navigation, bundle and image assets.

## Search and AI crawler visibility

The production build prerenders public pages, including localized rules and roles,
so their text, canonical links and JSON-LD are available without JavaScript.
`router/structuredData.ts` describes the website, each public page and the free
browser game. Wiki breadcrumbs have a separate JSON-LD element so navigation
cannot overwrite page metadata. Both are updated by the router, avoiding loss of
breadcrumbs when prerender hydration unmounts components. Private routes and the
404 page omit this graph.

`npm run build` checks the generated HTML and sitemap in every supported locale, representative
structured data, and metadata updates during navigation in Chromium.
To check a running Nginx deployment, run:

```sh
SEO_BASE_URL=https://avalon-game.com npm run check:seo:http --workspace=packages/ui
```

This also probes public HTML with Googlebot, OAI-SearchBot and PerplexityBot
User-Agent headers. It does not authenticate crawler IPs or prove indexing.
If a CDN or firewall is added, verify its crawler policy separately. The existing
`robots.txt` allows all crawlers; no separate training policy is introduced here.

After deploying, inspect representative URLs in webmaster tools and monitor
crawler requests and referral traffic. Crawlability and structured data do not
guarantee inclusion in AI answers. Google does not require an `llms.txt` file or
special AI schema: https://developers.google.com/search/docs/appearance/ai-features

## Images served by the application server

Game artwork lives in `src/assets/images` and game icons in `src/assets/icons`.
These tracked files are the source of truth. Webpack emits every image, premium
avatar and sticker into `dist/img/`; the UI container serves them from
`https://avalon-game.com/img/`. Development uses the same paths. Favicons and
the web manifest remain in `public`.

Use `getImagePathByID(category, id)` from `@/helpers/images`; premium artwork and
stickers use PNG, other categories use WebP. `getImagePath(path)` takes a relative
filename for SEO metadata. `getIconPathByName(name)` and SCSS helpers take IDs
without the `.webp` extension. Do not add literal cloud URLs. Webpack emits
separate files with a 16-character content hash, shared by JS, CSS and SEO.
Changing image bytes changes the URL; unchanged images retain their URLs.
Nginx serves hashed images with `Cache-Control: public, max-age=31536000, immutable`.

### Release sequence

`.github/workflows/publish.yml` builds the UI once using the `release-artifact`
Docker target and exports the audited result to `ui-release/`. Build checks verify
all tracked images, CSS and SEO references and reject Yandex Storage references
in HTML, CSS and JavaScript. `image-release.json` records filenames, sizes and
SHA-256 digests. CI verifies production nginx routing, then packages the exact
artifact, including all images, with `ui-release.Dockerfile`. No storage upload,
AWS CLI or Yandex storage credentials are required.

Production mounts its own nginx configuration. It must include the `/img/`
immutable-cache location from the repository nginx configuration. The initial
migration and historical-image archive are documented in
[the migration record](../../deploy/images/README.md).

Publication does not deploy or restart the live server. Keep previous UI images
for rollback. Historical Yandex objects are retained for clients with cached old
JavaScript; new releases request images from the application server.

### CI build caches and cleanup

Both Docker builds use Docker Hub registry caches with `mode=max`:
`<DOCKER_HUB_USERNAME>/backend-avalon:buildcache` for the backend and
`<DOCKER_HUB_USERNAME>/nginx-avalon:buildcache` for the audited UI build. These
separate, mutable tags reuse the existing Docker Hub credentials and repositories;
they are build caches, never deployment image tags. The first build after migration
starts without a registry cache. UI authentication runs before the audited export;
publication still packages that exact export after routing and image checks.

The workflow no longer exports UI BuildKit caches to GitHub Actions storage.
After **both** container publications succeed, a separate cleanup job lists all
GitHub cache pages, then deletes only legacy `index-ui-build-<version>-*` and
`buildkit-blob-<version>-sha256:*` keys on `refs/tags/v*` or historical
`refs/heads/refs/tags/v*` refs. Branch, pull request and non-version-tag caches,
and unrelated cache keys, are retained. Only this job has `actions: write`.
Failed, skipped or cancelled publications do not trigger cleanup. An already
removed cache (HTTP 404) is logged and skipped; other API errors fail cleanup and
appear in the run logs. A cleanup failure does not undo published images.

Publication remains serialized without cancelling active releases. The resolver
has a 15-minute timeout, each publisher 30 minutes, and cleanup 10 minutes.
Run `node --test .github/tests/*.test.cjs` to check release validation, publication
ordering, cache selection and cleanup failure behavior without contacting GitHub
or Docker Hub.

### Local verification and manual recovery

```sh
npm test --workspace=packages/ui
npm run build:ui
```

A failed build or image audit must be fixed before publication. Re-run the normal
release workflow; images are included in the UI artifact and need no separate upload.

### Small user avatars

`Avatar.vue` uses a shared max-512px WebP preview through `getAvatarPathByID`.
Full role/wiki images and CSS role icons keep their existing URLs; cropped role
icons can magnify artwork by up to 230%. The preview supports user avatars up to
150 CSS pixels at DPR 3 without fetching the full role portrait.

`npm run generate:avatars --workspace=packages/ui` regenerates previews from
`src/assets/images` using pinned Sharp, quality 85 and lossless alpha. It runs
before serve and production builds. Run it before directly invoking image tests on a clean checkout.
After replacing artwork during a dev session, rerun it or restart the dev server.
`src/assets/avatars` is generated and ignored by Git; do not edit it manually.

Previews use the existing content-hash URLs, immutable cache and image release
manifest. Both sizes are included in the published UI container. Opening a
role page after an avatar may download the larger image separately. Historical cloud objects remain available for clients with cached old builds.

## 2048 playground

The gamepad button to the right of the room voice controls opens a playground on the left of the table, with a **2048** tile and two coming-soon slots. Choosing **2048** opens its responsive game panel. `PlaygroundLauncher.vue`
loads `Game2048.vue`, its engine, copy and CSS through the `playground-2048` dynamic
chunk only after choosing its tile; opening the picker does not fetch the game. No game assets or dependencies are added to the startup bundle.
The production bundle audit and `scripts/check-playground.cjs` guard this boundary.

The board, score and best score stay in `localStorage` under
`avalon.playground.2048.v1`; no account or backend is involved. Invalid saves start
fresh, and blocked storage leaves the game playable with a visible saving notice.
Pointer swipes are confined to the board; arrow keys, WASD and on-screen controls
are available. The panel closes and saves when the room requires the player's action.

Run the engine tests with `node --test packages/ui/scripts/playground-2048.test.cjs`.
The browser check runs as part of `npm run check:build --workspace=packages/ui`;
set `PLAYGROUND_SCREENSHOTS` to a directory to capture desktop and mobile previews.

## Startup performance

The HTML head queues one early **Create room** action until `avalon:ready` fires
following hydration, preference restoration and Vue's next tick. Account dialogs
load on demand; App owns their event-bus subscriptions so the opening event cannot
be lost while a chunk loads. Analytics queues are installed immediately, but SDKs
start after readiness plus a 1-second delay and idle callback (2-second timeout).
A hidden-page fallback makes a best-effort attempt to load them for early exits;
it cannot guarantee delivery when a browser closes the page immediately. Recovery
pages and prerender never initialize analytics.

Prerender captures route/dictionary preloads before importing its build-only SSR
renderer. `check-bundle.cjs` validates complete HTML entry dependencies, including
route chunks and locale fallbacks: JS below 350 KiB gzip per ordinary public
entry, 383.25 KiB for wiki entries and 466 KiB for chart pages. CSS stays below
51 KiB per ordinary/wiki entry and 56 KiB for chart pages. App/vendor JS is
limited to 270 KiB; with common locale fallbacks, 332 KiB. Each common language
dictionary also has its own 29–37 KiB limit, so wiki copy cannot silently return
to the shared download. The Trapper guide has separate per-language chunks, loaded
only on its own page; other wiki entries must not preload them. It rejects renderer preloads and icon
fonts over 25 KiB. Third-party SDKs are outside these first-party budgets.

`check-startup.cjs` exercises an early click with JavaScript deliberately held,
login close/reopen, article chunk isolation, and opening native premium details
before hydration. Production `check:build` runs this along with existing browser
checks. Premium copy stays in HTML; its media mounts only after first opening.

Image preparation also generates 128px thumbnails. Small inline role icons,
addon icons and team badges use them; full portraits and card artwork retain
originals. The Material Icons subset is checked in; normal builds need no Python.
See `src/assets/fonts/README.md` when adding icon names or updating Vuetify.

## Release preflight

`Check UI before release` runs for pull requests and pushes to `master`. It builds
`ui.Dockerfile` for Linux amd64 using the same pinned Node/Chrome container as
publication, then runs the existing tests, prerender, bundle budgets, browser
checks and production nginx routing checks. No registry credentials or container
publishing are needed for this check.

`npm version` runs `npm run check:release` before changing version files or
creating a tag. It requires a clean working tree and an authenticated GitHub CLI
(`gh auth status`). Normally it only checks the previous release's budget flag;
it does **not** require pushing or waiting for a CI run on the current commit.

Numeric bundle size overruns in the release container are warnings. The build
writes `bundle-budget.json`, and CI persists a durable commit status in GitHub
(`avalon/bundle-budget/release-<run-id>`). That release can publish both containers.
The next local `npm version` is blocked if the previous release exceeded budget.
To unblock, fix the size, commit and push the fix to `master`, and wait for
`Check UI before release` to verify the exact commit you will release. Its green
`avalon/bundle-budget` status confirms the repair. Repeated checks use the newest
status, so an older passing result cannot hide a subsequent failure.

A missing/incomplete/failed previous release check blocks release until it is
resolved. Successful releases predating this policy have no debt flag and are
accepted. Network/authentication errors fail closed. Direct `git tag` bypasses
npm hooks; use `npm version` for the protected release path.

Tag publication calls the preflight for its resolved release commit. Both backend
and UI publishing wait for it, including saving the budget flag. The UI container
packages the verified artifact instead of compiling it again. Manual publication
validates the selected tag in the same way. Tests, build errors, dependency audit
violations and other functional checks remain fatal. Ordinary local UI builds
also keep numeric budgets strict; only the release Docker build explicitly sets
`AVALON_BUNDLE_BUDGET=report`. PR builds cannot write budget statuses.

Workflow and release-gate regression tests run with
`node --test .github/tests/*.test.cjs`; the UI Docker build runs them before the
full application build.

## Feature guides

- [AI Arena](../../docs/ai-rooms.md), [voice beta](../../docs/voice-chat.md) and [persistent room chat](../../docs/room-chat.md)
- [Community boards](../../docs/player-boards.md), [recovery](../../docs/password-recovery.md) and [support payments](../../docs/payments/direct-crypto.md)
- [Localization](src/i18n/README.md), [SEO/URL policy](SEO.md) and [icon font maintenance](src/assets/fonts/README.md)

Performance measurements in dated reports describe the tested build/environment.
Recheck live metrics after deploying; a passing build does not measure production LCP.
