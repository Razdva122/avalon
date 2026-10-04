# Avalon: The Resistance Online

A browser game for playing Avalon with friends: hidden roles, team votes, missions,
assassination and optional addons. Play at **[avalon-game.com](https://avalon-game.com/)**.

## Features

- Real-time rooms for 5–10 players, spectators, game history and rematches.
- Configurable roles and addons, including Lady of the Lake, Excalibur and Plot Cards.
- Accounts, ratings, achievements, avatars and reaction stickers.
- Persistent room chat and optional LiveKit voice chat (beta).
- Community boards for finding a group or recruiting players.
- AI Arena with 5–8 bots, three discussion languages, Yandex models and optional Codex.
- Six interface languages: English, Russian, Spanish, Portuguese, Simplified Chinese
  and Traditional Chinese. Public rules and wiki pages are prerendered.
- Optional email password recovery and direct BTC/USDT support payments.

## Local development

Requirements: **Node.js >=22.12.0**, npm and Docker with Compose. Run commands from
this repository's root. The checked-in development environment is for local use;
see [environment configuration](docs/environment.md) before adding secrets.

```sh
npm ci
npm run dev
```

Open **http://localhost:8080**. The backend listens on **http://localhost:3000**;
MongoDB is published on port **27017** and mongo-express on **8081**.
`npm run dev` starts MongoDB and mongo-express, waits for the MongoDB port, then
starts the UI and backend. Its script calls the `docker-compose` executable.
If your installation provides only `docker compose`, use:

```sh
docker compose -f docker-compose.dev.yml --env-file packages/backend/.env.development up -d
npm run dev:lite
```

With an existing MongoDB, configure `packages/backend/.env.local` and run
`npm run dev:lite`. Stopping the dev servers leaves the database containers running.
To stop them while retaining data:

```sh
docker compose -f docker-compose.dev.yml --env-file packages/backend/.env.development down
```

## Commands

| Command (repository root)                                  | Purpose                                                |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| `npm run dev`                                              | Start local database and both dev servers              |
| `npm run dev:lite`                                         | Start both dev servers using an existing database      |
| `npm test`                                                 | Backend Jest tests, then UI Node tests                 |
| `npm run test --workspace=packages/backend -- --runInBand` | Backend tests only                                     |
| `npm test --workspace=packages/ui`                         | UI tests only                                          |
| `npm run build:ui`                                         | Production UI build, tests and generated-asset checks  |
| `npm run start:backend`                                    | Production backend (requires production configuration) |

Some backend tests start temporary MongoDB instances and may download a MongoDB
binary on first use. UI production checks require Chromium; see the
[development guide](docs/development.md) for local browser configuration.

## Repository

This is an npm workspace monorepo. Install dependencies once at the root.

| Location                                         | Responsibility                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| [`packages/backend`](packages/backend/README.md) | Express, Socket.IO, RxJS game engine, MongoDB and background workers      |
| [`packages/ui`](packages/ui/README.md)           | Vue 3, Vue Router, Vuex, Vuetify, localization and static page generation |
| [`packages/types`](packages/types/README.md)     | Shared TypeScript contracts and persistence models                        |
| [`docs`](docs/README.md)                         | Current guides and dated research/implementation history                  |
| [`deploy`](deploy/README.md)                     | Production configuration, voice services, backups and Codex worker        |
| `.github/workflows/publish.yml`                  | Version-tag container and game-image publication                          |

## Documentation

Start with the **[complete documentation index](docs/README.md)**.

- [Development and troubleshooting](docs/development.md)
- [Architecture and data flow](docs/architecture.md)
- [Backend environment](docs/environment.md)
- [Releases and production deployment](deploy/README.md)
- [AI Arena](docs/ai-rooms.md), [voice chat](docs/voice-chat.md), [room chat](docs/room-chat.md)
- [Community boards](docs/player-boards.md), [password recovery](docs/password-recovery.md)
- [Direct crypto support](docs/payments/direct-crypto.md)
- [Localization](packages/ui/src/i18n/README.md), [SEO](packages/ui/SEO.md)
- [Database migrations](docs/database-migrations.ru.md) and [backups](deploy/voice/database-backups.md)

Release publication builds containers and uploads images; live deployment is a
separate operator action. Dated reports record past checks, not the currently
running production version.
