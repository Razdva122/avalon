# Image migration from Yandex Storage

On 2026-10-14, all 434 image objects in the public `avalon-game` bucket were
copied to FirstByte (`157.228.134.198`). Nine empty directory-marker objects were
excluded. Total image size: 36,236,202 bytes. The listing was complete
(`IsTruncated=false`); every copied image was checked against its object size
and single-part ETag (MD5). SHA-256 hashes were recorded as well.

- Archive: `/opt/avalon/image-archive/`, preserving original object keys.
- Manifest: `/opt/avalon/image-archive-manifest.json` (keys, sizes, ETags, SHA-256).
- Prepared configuration and original backups:
  `/opt/avalon/production/images-migration-20261014T071025Z/`.

**No running containers or active server configuration were changed.**
Server activation is performed by the operator. Yandex objects were not deleted,
so clients with cached old JavaScript continue to load their original image URLs.

## Update the UI

Version `v72.3.2` includes the project changes: every UI image is packaged in the
UI container and referenced as `/img/<name>.<16-character-content-hash>.webp`
(or `.png`). JavaScript, CSS and SEO metadata use the application host.
CI no longer uploads images to Yandex or requires its storage secrets.
Wait for the release workflow to succeed before selecting its image.

The production nginx configuration is bind-mounted from
`/opt/avalon/production/nginx.conf`; updating the UI image alone does not update
that file. Add the following location inside the `avalon-game.com` HTTPS server
for immutable image caching:

```nginx
location ~* "^/img/[^/]+\.[a-f0-9]{16}\.(?:png|webp)$" {
  add_header Cache-Control "public, max-age=31536000, immutable";
  try_files $uri =404;
}
```

Normal releases serve all current images from the UI container without an
additional volume. Keep the host archive when upgrading or restoring the server.

## Serve the historical archive

To expose all copied historical images too, add this read-only volume to the
existing `ui` service:

```yaml
- /opt/avalon/image-archive:/var/www/avalon-images:ro
```

Add the following location to the same HTTPS server:

```nginx
location ^~ /cloud-images/ {
  alias /var/www/avalon-images/;
  add_header Cache-Control "public, max-age=31536000, immutable";
}
```

An archived object with key `images/roles/merlin.webp` is then served at
`https://avalon-game.com/cloud-images/images/roles/merlin.webp`; a versioned
object with key `assets/img/<filename>` is served at
`https://avalon-game.com/cloud-images/assets/img/<filename>`.
These archive URLs are not used by the new UI, which uses `/img/`.

`nginx.candidate.conf` and `compose.candidate.yaml` in the preparation directory
contain these routing/volume additions, but the Compose candidate still has the
old UI image. Compare them with the current active files and choose the intended
published UI image rather than copying an old candidate over newer settings.
Validate nginx/Compose before activation and preserve TLS, networking and volumes.

After updating, check `image-release.json` has `publicBase: "/"`, verify image
HTTP 200 responses and cache headers, and inspect browser image requests for
Yandex Storage URLs. `/tmp/avalon-verify-images.py` on FirstByte checks every
archive URL and every current release image against its size, SHA-256, MIME and
cache headers; run it after enabling the archive route and deploying the new UI.

For rollback, use the previous UI image and preserved nginx/Compose configuration.
Do not delete the image archive or Yandex objects during rollback.
