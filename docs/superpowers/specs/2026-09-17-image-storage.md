# Unified image storage

The approved direction is Yandex Object Storage with automatic uploads during releases.
Tracked `packages/ui/src/assets/images` and `icons` remain the source of truth.
Production builds emit content-hashed image files and reference them at
`https://storage.yandexcloud.net/avalon-game/assets/img/`. Development uses local
files through the same helpers. Browser favicons and the web manifest stay local.

One release build produces both the upload directory and the HTML/JS/CSS packaged
in Nginx. Upload images before publishing the UI container. Use one-year immutable
cache headers, explicit image MIME types and public read access. Keep old objects
for existing clients and rollback; never sync with deletion. Verify every image's
public URL, length, MIME type and cache headers before publishing the UI image.
Credentials are GitHub Actions secrets, available only to the upload step.
No keys are passed to Docker or embedded in frontend code.

Existing game helpers, premium avatars, stickers, SCSS backgrounds and Open Graph
metadata share Webpack's asset pipeline. Test the generated URLs, release artifact,
uploader validation and actual upload command failure handling. Full production
build retains all current SEO, browser-navigation and bundle checks.
