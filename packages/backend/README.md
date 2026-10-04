# @avalon/backend

Express and Socket.IO server for Avalon, running TypeScript through ts-node.
MongoDB persistence uses Mongoose/Typegoose; the game stage engine uses RxJS.

[Documentation index](../../docs/README.md) · [Development](../../docs/development.md)

## Run from the repository root

```sh
npm ci
npm run dev --workspace=packages/backend
```

Configure and start MongoDB first, or use `npm run dev` at the root to start the
complete development stack. Production uses `npm run start:backend`.
The backend opens port 3000 only after database connection, migrations, required
indexes, service initialization and rating scheduler startup.
[Environment loading and optional features](../../docs/environment.md).

## Source map

| Directory                        | Responsibility                                                         |
| -------------------------------- | ---------------------------------------------------------------------- |
| `core/game`, `core/game-manager` | Roles, addons, missions and observable game stages                     |
| `main`, `room`, `user`           | Socket endpoints, rooms, chat, authentication and sessions             |
| `db`                             | Models, connection, migrations and query helpers                       |
| `scripts`                        | Rating operations, scheduled calculation and operator utilities        |
| `achievements`, `stickers`       | Progress, unlocks and game reactions                                   |
| `ai`                             | Bot profiles, decision pipeline, budgets, replay storage and providers |
| `voice`                          | LiveKit access and signaling gateway                                   |
| `recovery`                       | Email recovery routes, encrypted outbox and delivery worker            |
| `support`                        | Direct blockchain support verification and worker                      |
| `player-boards`                  | Listings, lifecycle rules, reports and moderation                      |
| `security`                       | Validation, socket admission and request limits                        |

HTTP routers are mounted at `/api/auth`, `/api/support` and `/api/player-boards`.
Most room/game interactions use typed Socket.IO events from `@avalon/types`.
Voice signaling uses a separate listener, configured through `VOICE_GATEWAY_*`.

## Checks and operations

```sh
npm run test --workspace=packages/backend -- --runInBand
npm run lint --workspace=packages/backend
npx tsc --noEmit -p packages/backend/tsconfig.json
```

Integration tests may download an isolated MongoDB binary. They do not require
production data. See [development troubleshooting](../../docs/development.md).
Operator scripts can change the selected database: read their feature guide and
verify environment selection before running them. Built-in achievements are
ensured automatically on startup; details and the obsolete manual script are documented in
[achievements](src/achievements/README.md).

Production operations: [deployment](../../deploy/README.md),
[migrations](../../docs/database-migrations.ru.md),
[backups](../../deploy/voice/database-backups.md).
