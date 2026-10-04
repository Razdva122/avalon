# Release and deployment guide

[Documentation index](../docs/README.md) · [Development](../docs/development.md)

Publication and live deployment are separate operations. Repository configuration
cannot identify the version currently running on a VM; verify it with the operator.
The development Compose file is not the production topology.

## GitHub release publication

`.github/workflows/publish.yml` runs on a pushed `v*.*.*` tag or manual dispatch
with an existing version tag. The resolver validates that tag and pins its commit.
Publication is serialized without cancelling an active release.

Required repository configuration:

| Kind     | Name                           | Purpose                                          |
| -------- | ------------------------------ | ------------------------------------------------ |
| Variable | `DOCKER_HUB_USERNAME`          | Container repositories and registry build caches |
| Secret   | `DOCKER_HUB_ACCESS_TOKEN`      | Docker Hub login                                 |
| Secret   | `YC_STORAGE_ACCESS_KEY_ID`     | Static storage key ID                            |
| Secret   | `YC_STORAGE_SECRET_ACCESS_KEY` | Static storage secret                            |

The workflow checks mounted nginx compatibility, then builds the backend and UI.
The UI is exported from the `release-artifact` target, validated using production
nginx routing, and its hashed images are uploaded/verified in Yandex Storage.
Only then is the same UI artifact packaged into the nginx image. Image names:

- `<DOCKER_HUB_USERNAME>/backend-avalon:<version-tag>`
- `<DOCKER_HUB_USERNAME>/nginx-avalon:<version-tag>`

Both builds reuse separate Docker Hub `buildcache` tags. After both publications
succeed, a cleanup job removes only obsolete version-tag BuildKit caches from
GitHub Actions. Details and manual recovery:
[UI release guide](../packages/ui/README.md#images-and-yandex-storage-releases).
A failed UI upload must be corrected and retried before deploying that UI.

The root `npm version` lifecycle runs tests, updates workspace versions, stages
files, pushes commits and pushes its version tag. Inspect the worktree and
release contents before invoking it; documentation edits alone do not need a new
container release.

## Live rollout

1. Confirm the selected release publication succeeded and both image tags exist.
2. Back up the target database and verify the backup according to the backup guide.
3. Preserve production secrets, volumes and existing network/certificate settings.
   Configure required flags and Compose fragments before switching images.
4. Wait for human and AI games to finish. Backend recreation disconnects active games.
5. Pull the selected images and recreate the intended services using the VM's
   actual Compose project/service names. A restart alone does not select a new image.
6. Check backend startup/migrations, homepage, room/socket access and relevant APIs.
   Run public SEO HTTP checks after a UI/nginx update.

Rollback must preserve database volumes, migration markers, AI ledgers, stored
image objects and authentication state. Check schema compatibility before using
an old backend; some migrations/authorization changes cannot simply be reversed.

## Operational guides

- [Backend environment and precedence](../docs/environment.md)
- [Database migrations](../docs/database-migrations.ru.md)
- [Database backup/restore](voice/database-backups.md)
- [Mounted nginx configuration compatibility](nginx/README.md)
- [Voice beta topology and rollout](../docs/voice-chat.md)
- [Yandex AI budgets and rollout](ai-production.md)
- [Codex local container / remote SSH worker](codex-production.md)
- [Password recovery](../docs/password-recovery.md) and [Russian production runbook](../docs/production-password-recovery.ru.md)
- [Direct crypto support](../docs/payments/direct-crypto.md)

Compose fragments are examples to merge into the existing deployment, not
standalone commands that replace the production stack. Historical VM preparation
notes describe their recorded date and do not confirm current deployment status.
