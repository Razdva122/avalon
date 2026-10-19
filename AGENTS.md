# Avalon agent notes

## Local tests and sandbox permissions

- This trusted repository defines the `avalon-local` permission profile in
  [.codex/config.toml](.codex/config.toml). It retains workspace filesystem
  protections and allows local test listeners; external command networking stays
  filtered through a proxy with only loopback hosts allowlisted.
- Backend integration tests start a temporary MongoDB. HTTP, nginx and browser
  fixtures may also open local ports. Plan the required local-port permission
  before running these checks, including a full backend or AI test run.
- Already-open or managed chats can retain a stricter runtime profile despite
  project config. If the current runtime says network access is restricted and
  does not use `avalon-local`, request narrowly scoped permission for the test
  command on its first run. Do not first run the full suite just to rediscover
  `listen EPERM` / `sandbox_apply: Operation not permitted`.
- A port permission failure is an environment failure, not a MongoDB or product
  regression. Do not skip integration tests, replace MongoDB with mocks, swallow
  the error or disable the filesystem sandbox to make checks appear green.
- Use [docs/development.md](docs/development.md) for commands and profile details.
