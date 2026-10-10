# Codex on the production backend

[Documentation index](../docs/README.md)

The backend image installs `@openai/codex@0.159.2`. Select an image built from the current repository; older images may lack
production opt-in or remote transport.
Codex stays disabled until `AI_CODEX_ENABLED=true`; all existing administrator
access checks, pacing and subscription usage accounting remain in place.
Codex is the only supported AI provider; there is no paid inference fallback.
The AI Arena also requires `AI_ROOMS_ENABLED=true`, included in the fragment.

## Choose the transport

Use local mode when the backend container can authenticate with ChatGPT directly.
Use the [remote Compose fragment](compose-codex-remote.fragment.yaml) when the
CLI and credentials are hosted on a separate worker. Remote mode is selected by
`AI_CODEX_SSH_HOST` and requires user, key and pinned known_hosts paths; the default
SSH port is 10022. Do not merge both authentication layouts by accident.
The worker scripts and tests are under `deploy/codex-worker`.

The VM preparation sections below are dated operational records. Their successful
checks do not establish the currently running release or current authentication state.

## Prepare the VM (local mode)

Merge [compose-codex.fragment.yaml](compose-codex.fragment.yaml) into the existing
production Compose. Keep its application secrets, database volumes and network
settings. Use the backend image from the new release. Initially keep Codex disabled.

Create the persistent volume on the VM before applying the Compose:

```sh
docker volume create avalon-codex
```

This external volume survives normal Compose teardown. Do not delete it: it stores
ChatGPT credentials and refresh tokens. Never include it in an image, Git or logs.

## Sign in

Commands below must run from the production Compose directory with its usual
project name and Compose arguments. Replace `backend` if the service has another name.
The one-off login uses the same image and mounted volume as the backend; it does
not restart the running backend. Ensure the new image is selected first.

```sh
docker compose run --rm --no-deps backend sh -c 'umask 077; CODEX_HOME="$AI_CODEX_HOME" codex -c cli_auth_credentials_store="\"file\"" login --device-auth'
docker compose run --rm --no-deps backend sh -c 'CODEX_HOME="$AI_CODEX_HOME" codex login status'
```

The owner of the subscription opens the displayed OpenAI URL and enters the
one-time code. Enable device-code login in ChatGPT security settings if needed.
Do not send `auth.json` or tokens through chat.

After login, set `AI_CODEX_ENABLED: 'true'` and apply the backend service during
the deployment window. Recreating it disconnects games and requires the normal
production rollout procedure. The application continues to use `NODE_ENV=production`.

## Verify and roll back

Check `codex --version` and login status in the backend. In the administrator UI,
check model discovery and the weekly subscription limit before starting one
supervised Codex game. These discovery calls do not start a model turn.
Check that a non-administrator cannot create/manage games or inspect limits.
Model calls require outbound access to OpenAI; no additional inbound port is needed.

Disable new Codex access with `AI_CODEX_ENABLED=false` and recreate the backend
using the usual deployment procedure. Preserve the volume for subsequent login.
Stop any active Codex game before disabling or rolling back. Subscription limits
are shared with other use of the same ChatGPT account.

The runner uses a temporary working directory, disables tools and does not pass
backend credentials to the CLI. It forces ChatGPT authentication, never API-key
billing. Production deployment and a real model turn must be verified on the VM;
local mocked tests do not prove its authentication or network access.

Official references: [headless authentication](https://learn.chatgpt.com/docs/auth),
[non-interactive Codex](https://learn.chatgpt.com/docs/non-interactive-mode).

## VM preparation on 2026-10-01

On the current production VM, a separate `avalon-codex-bootstrap:0.159.2` image
was built from `razdva12/backend-avalon:v69.0.1` with the pinned CLI. Its Dockerfile
is in `~/avalon-codex/Dockerfile`. The external `avalon-codex` volume was created
and its root permissions set to 700. Production containers were not modified.

Device authentication failed: OpenAI returned HTTP 403 with
`unsupported_country_region_territory`. No login succeeded. Resolve supported
hosting before retrying authentication or enabling the production provider.
The bootstrap image is only a login/preparation helper; it does not contain the
new production opt-in application code and must not replace the backend image.

## Separate worker VM preparation

An isolated `avalon-codex:0.159.2` image was installed on the separately supplied
worker VM. Files live under `/opt/avalon-codex`; `state` is owned by UID 10001
with mode 700. `/opt/avalon-codex/run` invokes the CLI as that unprivileged UID
with 256 MiB memory, 0.5 CPU, 64 PIDs, dropped capabilities, no-new-privileges,
read-only root filesystem and a 64 MiB temporary filesystem. No ports are
published. It uses direct outbound access to OpenAI; VPN configuration, routing
and firewall rules were not edited. The image includes system CA certificates.

Device login on this VM was completed by the account owner; a fresh isolated
CLI invocation confirmed `Logged in using ChatGPT`.

## Production SSH bridge

The worker is provisioned under a dedicated `avalon-codex` system account. Its
root-owned `authorized_keys` permits only the production VM source IP and forces
`/opt/avalon-codex/ssh-entrypoint`. `restrict` disables PTY and forwarding.
The account is not in the Docker group. Its only passwordless sudo permission is
the root-owned `/opt/avalon-codex/worker-launch` with no arguments. Root/admin
SSH login and the VPN configuration were not changed.

The production private key was generated **on production** under
`/opt/avalon/codex-ssh/id_ed25519`; it was not copied to the repository or worker.
`known_hosts` beside it pins the verified worker Ed25519 host key. This directory
is root-owned and mode 700. No root password is used by the application.

The worker accepts bounded JSON on stdin for `decide`, `models`, or `limits`.
It sends JSON on stdout. The launcher uses a nonblocking flock for one request,
buffers the Docker result in a temporary root-only file, and sends whitespace
heartbeats directly over SSH while running. An SSH disconnect stops the launcher
and removes the container. Container creation completes synchronously before
the background attach client is started, so cancellation cannot leave a late
unregistered container behind. Cleanup also stops the Docker client. Metadata reads
can retry a busy worker; game decisions are never automatically repeated.

The production VM successfully used its restricted key to retrieve the model
catalog and weekly quota. An arbitrary `id` command was denied. A live SSH
disconnect removed the worker container and freed the lock. Isolated Linux tests
also cover cancellation while container creation completes late.

### Enable remote mode during rollout

Merge [compose-codex-remote.fragment.yaml](compose-codex-remote.fragment.yaml)
into the Yandex Cloud production Compose and use the new backend image containing
the remote transport and OpenSSH client. Keep all existing secrets, mounts,
networks, UI and MongoDB configuration. The remote-worker configuration supersedes
the local Codex-auth volume fragment: ChatGPT credentials stay on the worker VM.
Keep `AI_CODEX_ENABLED=false` until the controlled rollout; then set it true.

At the recorded 2026-10-01 preparation, the `v69.0.1` backend did not implement
this SSH transport and was not restarted. This is historical evidence; check the
actual deployed image and configuration before rollout.
During rollout, check that no human or AI game is active before recreating backend.
Verify model selection and quota in the administrator UI, then start one supervised
game. A complete game and real model decisions remain rollout checks.

To disable the connection, set `AI_CODEX_ENABLED=false` and apply the normal
backend rollout. To revoke worker access immediately, remove only the dedicated
production key from `/home/avalon-codex/.ssh/authorized_keys`; existing root/admin
keys and VPN services remain independent. Preserve `state` for later login.

## Decision timeout recovery (2026-10-07)

A mixed five-seat production match paused at assassination after its SSH request
hit the 615-second transport deadline. The CLI wrapper had been killed at its
600-second deadline, but the native Codex descendant survived, holding stdout
open. The Node worker and launcher therefore remained alive and retained the
worker lock; later catalog reads returned `busy` without any newer game request.

The decision runner now starts the CLI in a separate POSIX process group and
kills that whole group on timeout, forbidden tool use, or excessive output. A
mock wrapper with a surviving descendant reproduced the hang before the fix;
regressions passed on macOS and in a network-isolated Linux container afterward.
The worker source was updated with a backup, the identified orphan container was
removed, and a production-backend catalog read succeeded. Game data and auth
state were preserved. The match stays technically paused until its administrator
uses the existing retry control; recovery did not generate a model decision.

A subsequent administrator retry also reached the decision timeout. This time
the worker container exited and released its lock, confirming process cleanup;
the reason Codex returned no decision remains unresolved. The worker now records
only the latest failure in `state/avalon-last-failure.json` (mode 600): timestamp,
elapsed time, a bounded reason, the last whitelisted event type, and a connection
or authentication classification. It never stores prompts, replies, or raw CLI
diagnostics. Network-isolated Linux regressions passed before this worker update.
