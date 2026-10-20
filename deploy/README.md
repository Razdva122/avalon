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

| Kind     | Name                      | Purpose                                          |
| -------- | ------------------------- | ------------------------------------------------ |
| Variable | `DOCKER_HUB_USERNAME`     | Container repositories and registry build caches |
| Secret   | `DOCKER_HUB_ACCESS_TOKEN` | Docker Hub login                                 |

The workflow checks mounted nginx compatibility, then builds the backend and UI.
The UI is exported from the `release-artifact` target, validated using production
nginx routing, and all hashed images are included in the same UI artifact
packaged into the nginx image. No Yandex Storage credentials are needed. Image names:

- `<DOCKER_HUB_USERNAME>/backend-avalon:<version-tag>`
- `<DOCKER_HUB_USERNAME>/nginx-avalon:<version-tag>`

Both builds reuse separate Docker Hub `buildcache` tags. After both publications
succeed, a cleanup job removes only obsolete version-tag BuildKit caches from
GitHub Actions. Details and manual recovery:
[UI release guide](../packages/ui/README.md#images-served-by-the-application-server).
A failed UI image audit must be corrected before deploying that UI.

### GitHub Actions storage quota

Release images and build caches are stored in Docker Hub. The UI export stays
on the build runner and is packaged there; no GitHub artifact transfer is needed.
`DOCKER_BUILD_RECORD_UPLOAD=false` disables the optional `.dockerbuild`
diagnostic uploads from Docker's build action. Normal workflow logs remain available.
See [Docker build action environment variables](https://github.com/docker/build-push-action/tree/v6#environment-variables).

If a storage alert arrives, check the latest Publish and Deploy run results before
assuming releases are blocked. Continue the normal release process while runs
are allowed. Merge the workflow change before pushing a new release tag; retrying
an old run still uses its old workflow. For an existing tag, manually dispatch
Publish from the updated `master` branch with that tag as input.

Deleting old artifacts reduces current storage but does not erase storage already
accrued during the billing cycle; usage reporting can take 6–12 hours to update.
The quota belongs to the repository owner and may also include other repositories
and GitHub Packages. Build caches have a separate allowance, so deleting caches
does not free the artifact allowance. See [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

If GitHub blocks runners with a billing error, this workflow change cannot unblock
them. The account owner can allow paid Actions usage with a payment method and a
bounded budget with **Stop usage when budget limit is reached**, or wait for the
next billing cycle. Without paid Actions, an operator can build and audit both
images locally using the same Dockerfiles and `linux/amd64` platform, publish new
version tags to Docker Hub, and invoke the existing restricted SSH deployment
entry point with an authorized key (see [deployment access](firstbyte/DEPLOY.md#access-and-server-installation)).
Preserve the nginx/UI audits and deployment safeguards; do not build on the
production server or overwrite an existing release tag.

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
5. Pull the selected images. FirstByte's manual deploy stages and atomically
   switches frontend files inside the running nginx gateway and recreates only
   backend. Do not recreate `ui` during ordinary application releases; see the
   [manual deployment guide](firstbyte/DEPLOY.md). A restart alone does not select
   a new backend image.
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
- [Codex-only AI configuration and rollout](ai-production.md)
- [Codex local container / remote SSH worker](codex-production.md)
- [Password recovery](../docs/password-recovery.md) and [Russian production runbook](../docs/production-password-recovery.ru.md)
- [Direct crypto support](../docs/payments/direct-crypto.md)

Compose fragments are examples to merge into the existing deployment, not
standalone commands that replace the production stack. Historical VM preparation
notes describe their recorded date and do not confirm current deployment status.

## Infrastructure privacy

Keep real host addresses, provider account IDs, SSH host keys and operational
incident/rollback records outside Git. Store CI connection values in the
`production` environment Secrets; keep host runtime configuration and backups
private. `.private-ops/` is ignored for local operator notes. Use example hosts
and documentation-only IP addresses in public guides. Removing a value from the
current tree does not remove it from earlier Git commits.
