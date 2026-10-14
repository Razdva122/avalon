# Manual production deployment

Production: FirstByte `157.228.134.198`, `/opt/avalon/production/compose.production.yaml`,
Compose project `avalon-production`. The runner does not build images or copy secrets/configuration.

## Release a version

1. Publish a version tag using the existing **Publish release containers and game images** workflow.
   Wait until **both** backend and UI publication succeed. Never overwrite release tags.
2. Open [Actions → Deploy to server](https://github.com/Razdva122/avalon/actions/workflows/deploy.yml).
3. Select **Run workflow**, branch **master**, and the published tag, e.g. `v71.0.0`.
4. Leave **check_only** disabled to deploy. Enable it to pull/check without changing containers.
5. For an abandoned unfinished game, enable **skip_room_check** («Пропустить проверку комнат»).
   It defaults to **false** and skips only the room check. Health checks and rollback
   remain mandatory. Unfinished games may lose their state, so use it only when that is acceptable.
   **check_only** takes precedence: with both boxes checked, no containers are changed.

The manual job is named **deploy to server**. A tag push only publishes images; it does not deploy.
The server pulls both images, records their immutable digests, checks room inventory immediately
before activation, then exports `/app` from the UI image without starting it. The running `ui` gateway
stages the files under `/app/.avalon-releases/<digest>` and atomically switches
`/app/.avalon-current`. Only `backend` is recreated with `--no-deps`; nginx keeps
its listening sockets open. Homepage, HTML and static assets remain available while
API/Socket.IO are temporarily unavailable. MongoDB, volumes, LiveKit/HAProxy
configuration, TLS and environment files stay in place.
There is a short backend interruption. Deploy during a quiet period: room checks are a safety
check, not a maintenance lock preventing new rooms from being created immediately afterward.

The previous static directory and backend image return automatically if container startup, HTTPS, nginx, voice health or the
Socket.IO/database check fails. **Database contents are never automatically rolled back.** Releases
with incompatible database migrations require a separate migration plan. Watchdog remains enabled
and may briefly stop/recover voice during the backend restart.

Selecting the already installed image digests checks health and exits without a restart or backup.
A missing image, nonempty/incomplete room inventory (unless explicitly skipped),
less than 5 GiB free disk or an
unresolved interrupted deployment blocks activation. Images are not automatically pruned: keep the
previous version available for rollback and inspect disk usage when deployment reports low space.

Backups run independently through the existing `avalon-backup.timer`; deployment does not start
or wait for a backup. Before a release requiring a database migration, arrange a fresh verified
backup separately. Data recovery uses the latest successful scheduled copy, while application
rollback still restores the previous images automatically.

## Static releases and gateway maintenance

The UI image digest in Compose identifies the desired **static release**. The
running gateway container keeps its original nginx image; normal deployment
updates its static files and startup wrapper, not the nginx binary. The wrapper
preserves host-mounted config, generates the runtime root `/app/.avalon-current`,
and reloads nginx gracefully. Ordinary Docker restart or host reboot retains the
selected release in the container writable layer. Explicit container recreation
uses the desired Compose image and its bundled `/app` files as the initial release.
Nginx base-image/security upgrades therefore need a separate planned gateway
rollout; do not run `compose up ui` as part of normal application deployment.

Old hashed JS/CSS/images/fonts are retained in both directions, including rollback,
so open tabs can still load their assets. Missing assets use hard links within the
container. Static release directories consume disk space and are not automatically
pruned. Inspect their size during disk maintenance; never remove the current or
previous rollback target. Gateway recreation resets this retained asset history.

To inspect the actual frontend release and effective root:

```sh
docker compose -f /opt/avalon/production/compose.production.yaml exec -T ui readlink /app/.avalon-current
docker compose -f /opt/avalon/production/compose.production.yaml exec -T ui nginx -T -c /etc/nginx/avalon-runtime.conf
```

`deploy-pending.json` records `previousStatic` and `uiContainer` for recovery after
an interrupted transaction. Retain that container while investigating the marker.
The nginx wrapper must be installed alongside the root-owned deploy script before
using this rollout method; the first real rollout installs it into the live
container and reloads nginx without restarting it.

## Access and server installation

- GitHub environment: `production`, deployment branch policy: **master only**.
- Environment secret: `FIRSTBYTE_DEPLOY_SSH_KEY` (dedicated ED25519 key, not an administrator key).
- SSH account: `avalon-deploy`, no Docker group membership, locked password.
- Public host key is pinned in `.github/firstbyte_known_hosts`; verify a changed fingerprint through
  the provider console/administrator connection, never disable host verification.
- `/var/lib/avalon-deploy` and `.ssh` are root-owned `0755`; `authorized_keys` is root-owned `0644`.
  Key options are `restrict,command="sudo -n /usr/local/sbin/avalon-deploy \"$SSH_ORIGINAL_COMMAND\""`.
- `/etc/sudoers.d/avalon-deploy` (`0440`, validated with `visudo -cf`) contains:
  `avalon-deploy ALL=(root) NOPASSWD: /usr/local/sbin/avalon-deploy`.
- Install `deploy.py` root-owned as `/opt/avalon/production/deploy.py` (`0700`), install `deploy/nginx/entrypoint.sh`
  as `/opt/avalon/production/nginx-entrypoint.sh` (`0755`), and symlink
  `/usr/local/sbin/avalon-deploy` to it. Install the existing `deploy/voice/check-idle.cjs` as
  `/opt/avalon/production/check-idle.cjs` (`0600`).
- Prerequisites: the existing FirstByte production compose, backup service, watchdog, Python 3,
  Docker Compose, curl, sudo and systemd. Deployment does not bootstrap a blank server.

Only exactly `deploy vX.Y.Z`, `deploy-skip-rooms vX.Y.Z` or `check vX.Y.Z` (optional prerelease suffix) is accepted; no shell,
forwarding or arbitrary commands. GitHub cannot upload/replace the server entry point. Script
updates require the administrator SSH key. The private CI key lives only in GitHub Secrets after
setup; rotate it by replacing this dedicated authorized key and environment secret.

## Diagnosis and rollback

The server runs deployments in a transient `avalon-deploy.service`. Closing SSH or cancelling the
GitHub job does not stop the server transaction. External operations have individual timeouts;
there is no overall systemd kill deadline that could interrupt rollback after a slow pull. GitHub concurrency and a server-side file lock
prevent simultaneous deployments. Check:

```sh
systemctl status avalon-deploy.service
journalctl -u avalon-deploy.service --since today
cat /opt/avalon/production/last-deploy.json
```

A completed transient unit is collected; its journal remains. The SSH entry point requires a fresh
`deploy-result-<invocation-id>.json` success receipt for the requested tag, so an operator-stopped service cannot
report a successful deployment. A failed job remains failed even when
the previous application was restored. An external HTTPS check from the runner also runs afterward;
a failure at that final step needs investigation and does not itself trigger a second rollback.

`compose.previous.yaml` contains the configuration before the last attempted deployment.
`deploy-pending.json` remains if rollback failed or the machine/process was forcibly interrupted.
Inspect the running containers and journal before an administrator clears that marker; do not
blindly retry or restore MongoDB. To return to an earlier compatible release, manually deploy its
published tag (with the same room and health checks).

After a server restore, reinstall the dedicated SSH user/sudo entry and `/usr/local/sbin` symlink;
the recovery bundle contains production files but not the account's `/var/lib` directory or sudoers.

## Checks

```sh
python3 -m unittest discover -s deploy/firstbyte -p 'test*.py'
node --test .github/tests/*.test.cjs
```

Tests exercise the actual compose transaction with isolated filesystem state and substitute only
external Docker/systemd/health operations. Real preflight, restricted SSH rejection and a no-op
v71 deployment were also checked on FirstByte during initial setup.

Optional real Docker integration check (isolated container, loopback-only HTTP;
the release image must already be pulled):

```sh
AVALON_DOCKER_TEST_IMAGE=razdva12/nginx-avalon@sha256:<ui-digest> \
  python3 -m unittest discover -s deploy/firstbyte -p test_static_integration.py
```

It continuously requests HTML during staging, switches and rollback, verifies
assets in both directions while API returns 502, and checks the selected frontend
after a container restart. It never restarts a production service.
