# @avalon/ui

This repository contains the user interface codebase for our application, built with Vue 3, Vuetify, and Vuex.

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
npm install
```

**Compiles and hot-reloads for development:**

```
npm run serve
```

**Compiles and minifies for production:**

```
npm run build
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
SEO_BASE_URL=https://avalon-game.com npm run check:seo:http
```

This also probes public HTML with Googlebot, OAI-SearchBot and PerplexityBot
User-Agent headers. It does not authenticate crawler IPs or prove indexing.
If a CDN or firewall is added, verify its crawler policy separately. The existing
`robots.txt` allows all crawlers; no separate training policy is introduced here.

After deploying, inspect representative URLs in webmaster tools and monitor
crawler requests and referral traffic. Crawlability and structured data do not
guarantee inclusion in AI answers. Google does not require an `llms.txt` file or
special AI schema: https://developers.google.com/search/docs/appearance/ai-features

## Images and Yandex Storage releases

Game artwork lives in `src/assets/images` and game icons in `src/assets/icons`.
These tracked files are the source of truth. Production serves every game image,
premium avatar and sticker from Yandex Object Storage; development serves the
same files locally. Browser favicons and the web manifest remain in `public`.

Use `getImagePathByID(category, id)` from `@/helpers/images`; premium artwork and
stickers use PNG, other categories use WebP. `getImagePath(path)` takes a relative
filename for SEO metadata. `getIconPathByName(name)` and the SCSS helpers take IDs
without the `.webp` extension. Do not add literal storage URLs or component-level
image imports. Webpack emits separate files with a 16-character content hash;
image bytes are not embedded in JavaScript. JS, CSS and SEO use the same URLs.
The hash depends on file contents, not release number or time. Upload sync uses
`--size-only`, so unchanged hashed objects are skipped even when build timestamps
change; bucket versioning does not accumulate duplicate uploads for those files.

`image-storage.cjs` is shared by Webpack, release validation and the uploader.
Production URLs use `https://storage.yandexcloud.net/avalon-game/assets/img/`.
Only the images use this external base; JavaScript, CSS and fonts stay on the UI
host. Uploaded images have explicit MIME types and
`Cache-Control: public, max-age=31536000, immutable`. Replacing an image changes
its URL. A normal rebuild preserves URLs for unchanged images.

### One-time configuration

1. Create a dedicated Yandex service account for CI. Grant `storage.uploader`
   **on the `avalon-game` bucket**, rather than on the entire folder. The uploader
   needs to list/read/upload objects, but not delete them or administer the bucket.
2. Make `assets/img/*` publicly readable in the bucket's access policy (or retain
   the existing public object-read setting). Listing and writing need not be public.
   The CI script does not change ACLs or bucket policy; it checks public access
   after upload and fails the release if an image is private.
3. Create a **static access key** for that service account. Add its two values as
   repository secrets in GitHub → Settings → Secrets and variables → Actions:
   - `YC_STORAGE_ACCESS_KEY_ID`: access key identifier.
   - `YC_STORAGE_SECRET_ACCESS_KEY`: secret access key.
4. Commit the workflow and source changes. The existing release trigger remains
   a pushed `v*.*.*` tag; no new Docker Hub variables or secrets are required.
   The workflow also supports **Run workflow** to build, upload and verify images
   without publishing either Docker container.

References: [Yandex static keys](https://yandex.cloud/ru/docs/iam/operations/authentication/manage-access-keys),
[bucket IAM roles](https://yandex.cloud/en/docs/storage/security/),
[AWS CLI with Yandex Storage](https://yandex.cloud/en/docs/storage/tools/aws-cli).

### Release sequence

`.github/workflows/publish.yml` builds the UI once using the `release-artifact`
Docker target and exports the audited result to `ui-release/`. The build checks
all tracked images, CSS and SEO references, then writes `image-release.json`
containing filenames, sizes and SHA-256 digests. CI validates that manifest before
uploading only `img/*.webp` and `img/*.png` through AWS CLI. Source maps, HTML and
other build files are never uploaded to the bucket.

CI checks every public image URL for HTTP 200, content length, MIME type and cache
headers. Only then does `ui-release.Dockerfile` package that exact exported build
into the existing Nginx image. Storage credentials are scoped to the upload step, never Docker build arguments
or frontend environment variables. Preflight only receives secret-presence booleans.

CI publication does not deploy or restart the live server. Deploy the prepared
container after current games finish, as before. Old server versions and open
client tabs retain their original image URLs during this delay and after rollout.

The uploader never deletes historical objects or the legacy `images/` / `icons/`
prefixes. Keep those objects for old clients and rollbacks. Keep lifecycle rules
from deleting `assets/img/` while an old UI version can still reference it. A failed
or cancelled run may leave extra hashed files, which is harmless. Retry a failed
run after correcting access, credentials or connectivity; it will upload missing
files and recheck all URLs before publication.

### Local verification and manual recovery

```sh
npm test --workspace=packages/ui
npm run build:ui
npm run upload:images --workspace=packages/ui -- --dry-run
```

To upload a checked production build manually, install AWS CLI and provide the
same static key via `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in your local
shell environment, then run `npm run upload:images --workspace=packages/ui`.
`--verify-only` checks public URLs without credentials or writes. Do not put key
values in checked-in files. GitHub secrets cannot be read back for local use.

For an offline production preview, use
`AVALON_IMAGE_SOURCE=local npm run build:ui`; its manifest is intentionally rejected
by the cloud uploader. `npm run serve --workspace=packages/ui` uses local images
by default. Direct Docker builds with `ui.Dockerfile` reference production cloud
images, so ensure those images are uploaded before deploying that container;
the release workflow handles that ordering automatically.

### Small user avatars

`Avatar.vue` uses a shared max-512px WebP preview through `getAvatarPathByID`.
Full role/wiki images and CSS role icons keep their existing URLs; cropped role
icons can magnify artwork by up to 230%. The preview supports user avatars up to
150 CSS pixels at DPR 3 without fetching the full role portrait.

`npm run generate:avatars --workspace=packages/ui` regenerates previews from
`src/assets/images` using pinned Sharp, quality 85 and lossless alpha. It runs
before image tests (and therefore production builds), and before the dev server.
After replacing artwork during a dev session, rerun it or restart the dev server.
`src/assets/avatars` is generated and ignored by Git; do not edit it manually.

Previews use the existing content-hash URLs, immutable cache and image release
manifest. Both sizes are uploaded before the UI container is published. Opening a
role page after an avatar may download the larger image separately. Old bucket
objects remain available for old clients and delayed deployments.

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
route chunks and locale fallbacks: 365 KiB gzip JS / 50 KiB gzip CSS per public
entry, with 480 / 55 KiB for chart pages. It rejects renderer preloads and icon
fonts over 25 KiB. Third-party SDKs are outside these first-party budgets.

`check-startup.cjs` exercises an early click with JavaScript deliberately held,
login close/reopen, article chunk isolation, and opening native premium details
before hydration. Production `check:build` runs this along with existing browser
checks. Premium copy stays in HTML; its media mounts only after first opening.

Image preparation also generates 128px thumbnails. Small inline role icons,
addon icons and team badges use them; full portraits and card artwork retain
originals. The Material Icons subset is checked in; normal builds need no Python.
See `src/assets/fonts/README.md` when adding icon names or updating Vuetify.
