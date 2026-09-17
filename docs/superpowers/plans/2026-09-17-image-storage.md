# Image Storage Implementation Plan

> **For agentic workers:** Use executing-plans to implement these tasks in order.

**Goal:** Serve production game images from Yandex Storage and upload them automatically before UI publication.

**Architecture:** Webpack emits hashed image files and remote URLs from shared storage configuration. CI exports one completed UI build, uploads and verifies its images, then packages that same artifact into Nginx.

**Tech Stack:** Vue CLI/Webpack 5, Node.js, AWS CLI, Docker Buildx, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-17-image-storage.md`.

## Global Constraints

- Bucket `avalon-game`, endpoint `https://storage.yandexcloud.net`, object prefix `assets/img/`.
- Source files stay in Git; development stays local; production uses the bucket.
- No deletion of historical objects; no credentials in build arguments or client code.
- Cache-Control: `public, max-age=31536000, immutable`.

## Task 1: Image URLs and release audit

Files: `packages/ui/image-storage.cjs`, `packages/ui/vue.config.js`,
`packages/ui/public/index.html`, `packages/ui/scripts/check-images.cjs`,
`packages/ui/scripts/image-storage.test.cjs`.

- [x] Test cloud/local URL configuration and compile real Webpack image imports, including CSS and HTML consumers, against expected bucket paths.
- [x] Configure resource emission with `img/[name].[contenthash:16][ext]` and production-only image publicPath.
- [x] Resolve HTML metadata as absolute URLs; preconnect to the configured image origin in cloud mode.
- [x] Adapt release audit to map cloud image URLs back to emitted files and reject legacy/unversioned URLs.

## Task 2: Safe upload and CI sequencing

Files: `packages/ui/scripts/upload-images.cjs`, `packages/ui/scripts/upload-images.test.cjs`,
`.github/workflows/publish.yml`, `ui.Dockerfile`, `ui-release.Dockerfile`.

- [x] Test rejection of empty/unhashed artifacts and credential omissions, MIME/cache upload arguments and public-read verification, and upload/public verification failure propagation.
- [x] Upload only hashed PNG/WebP files using AWS CLI with the Yandex endpoint and region `ru-central1`.
- [x] Verify public HEAD responses for status, size, MIME and cache headers.
- [x] Export the completed UI build from Docker, upload its images, and publish an Nginx image from the exact exported artifact only after successful verification.

## Task 3: Integration and setup

Files: `packages/ui/README.md`, `packages/ui/package.json`, `memory-bank/memory-bank-frontend.md`.

- [x] Document secret names, least-privilege bucket access, release steps, caching, development and rollback.
- [x] Run uploader/configuration tests, full production build, artifact audit and focused code review.
- [x] Run the manual GitHub workflow against this branch and verify all public objects using the configured repository secrets. Run `35208006794` succeeded; an independent local `--verify-only` verified all 99 public images.

## Additional release compatibility checks

- Unchanged image bytes keep the same URL across code-only releases; changed artwork gets a new URL (Webpack integration test).
- Upload sync uses `--size-only` to skip unchanged hashed objects regardless of rebuild timestamps.
- On 2026-09-17, the bucket console showed versioning disabled and no lifecycle configuration.
- CI still publishes artifacts only; live-server rollout remains delayed until games finish.
