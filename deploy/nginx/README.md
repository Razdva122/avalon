# Mounted nginx configuration compatibility

[Documentation index](../../docs/README.md)

The production Compose file mounts `/opt/avalon/voice-release/nginx.voice.conf`
read-only over `/etc/nginx/nginx.conf`. Updating the UI image therefore does not
update that configuration. Older voice configurations route board API requests
to the static site's 404 page.

Both UI images now use `entrypoint.sh`. On normal `nginx` startup it reads the
mounted config and writes `/etc/nginx/avalon-runtime.conf`. If the board API is
missing, `board-route.awk` adds it immediately before the existing support API
location, using that location's `proxy_pass`. All other configuration, including
voice servers and certificates, is retained. The host file is never written.
Nginx validates the generated file before starting. An existing board route is
left unchanged. Missing or ambiguous support locations fail startup with an
explicit diagnostic instead of guessing where to install an API route.

## Release

Publish the patch UI image normally, update the `ui.image` tag in the existing
Compose file, pull it, and recreate the `ui` service. No volume or certificate
changes are required; backend and MongoDB do not need restarting for this fix.
A restart of the old container alone does not load a new image. The backend must
already contain the board API (v68.0.1 does).

Verify publicly after deploying:

```sh
curl -i 'https://avalon-game.com/api/player-boards?kind=solo&page=1'
curl -i 'https://avalon-game.com/api/player-boards/me'
```

Expect JSON: HTTP 200 for the public list and HTTP 401 for `/me` without a token.
Inspect the effective configuration with:

```sh
docker exec nginx nginx -T -c /etc/nginx/avalon-runtime.conf
```

After editing the host config, recreate/restart the UI container to regenerate
its working copy. A plain nginx reload does not rerun the compatibility step.
Explicit `nginx -c ...` commands bypass the wrapper's config preparation.

## Verification

`node --test deploy/nginx/*.test.cjs` checks preservation and idempotency, validates
the generated configuration, and uses local nginx + an HTTP fixture to exercise
board, support, and voice routing. Nginx-dependent checks require a local nginx
binary and permission to listen on temporary loopback ports. The release workflow
installs nginx to run these checks before publishing.
