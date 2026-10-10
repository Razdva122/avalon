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
   It defaults to **false** and skips only the two room checks. Backup, health checks and rollback
   remain mandatory. Unfinished games may lose their state, so use it only when that is acceptable.
   **check_only** takes precedence: with both boxes checked, no containers are changed.

The manual job is named **deploy to server**. A tag push only publishes images; it does not deploy.
The server pulls both images, records their immutable digests, checks room inventory, runs the
existing verified off-host backup, checks rooms again, then updates only `backend` and `ui` with
`--no-deps`. MongoDB, volumes, LiveKit/HAProxy configuration, TLS and environment files stay in place.
There is a short application interruption. Deploy during a quiet period: room checks are a safety
check, not a maintenance lock preventing new rooms from being created immediately afterward.

The old images return automatically if container startup, HTTPS, nginx, voice health or the
Socket.IO/database check fails. **Database contents are never automatically rolled back.** Releases
with incompatible database migrations require a separate migration plan. Watchdog remains enabled
and may briefly stop/recover voice during the backend restart.

Selecting the already installed image digests checks health and exits without a restart or backup.
A failed backup, missing image, nonempty/incomplete room inventory (unless explicitly skipped),
less than 5 GiB free disk or an
unresolved interrupted deployment blocks activation. Images are not automatically pruned: keep the
previous version available for rollback and inspect disk usage when deployment reports low space.

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
- Install `deploy.py` root-owned as `/opt/avalon/production/deploy.py` (`0700`) and symlink
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
there is no overall systemd kill deadline that could interrupt rollback after a slow backup/pull. GitHub concurrency and a server-side file lock
prevent simultaneous deployments. Check:

```sh
systemctl status avalon-deploy.service
journalctl -u avalon-deploy.service --since today
cat /opt/avalon/production/last-deploy.json
```

A completed transient unit is collected; its journal remains. A failed job remains failed even when
the previous application was restored. An external HTTPS check from the runner also runs afterward;
a failure at that final step needs investigation and does not itself trigger a second rollback.

`compose.previous.yaml` contains the configuration before the last attempted deployment.
`deploy-pending.json` remains if rollback failed or the machine/process was forcibly interrupted.
Inspect the running containers and journal before an administrator clears that marker; do not
blindly retry or restore MongoDB. To return to an earlier compatible release, manually deploy its
published tag (with the same backup/room checks).

After a server restore, reinstall the dedicated SSH user/sudo entry and `/usr/local/sbin` symlink;
the recovery bundle contains production files but not the account's `/var/lib` directory or sudoers.

## Checks

```sh
python3 -m unittest discover -s deploy/firstbyte -p test_deploy.py
node --test .github/tests/*.test.cjs
```

Tests exercise the actual compose transaction with isolated filesystem state and substitute only
external Docker/systemd/health operations. Real preflight, restricted SSH rejection and a no-op
v71 deployment were also checked on FirstByte during initial setup.
