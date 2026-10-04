# @avalon/types

Shared TypeScript contracts imported by the UI and backend as `@avalon/types`.
This workspace is consumed directly from source; it has no standalone build or
publication script. Install dependencies at the repository root.

[Documentation index](../../docs/README.md) · [Architecture](../../docs/architecture.md)

## Contents

| Location                              | Contracts                                                             |
| ------------------------------------- | --------------------------------------------------------------------- |
| `api`                                 | Socket.IO events, acknowledgements, errors and rating socket types    |
| `game`                                | Roles, settings, stages, players, missions, votes, addons and history |
| `room.ts`                             | Live/archive room state, chat messages and AI settings                |
| `user`                                | Account/profile and user feature types                                |
| `stats`                               | Ratings, game summaries, achievements and persistence models          |
| `voice.ts`                            | Voice room state and client/server events                             |
| `player-board.ts`, `board-contact.ts` | Community board DTOs and shared validation                            |
| `consts`, `utils`                     | Shared constants and helper types                                     |

`index.ts` defines the public barrel. Some consumers intentionally import a
specific submodule, for example `@avalon/types/player-board`.
Use `import type` for type-only dependencies in UI code. Persistence modules use
Mongoose/Typegoose; importing those as runtime browser dependencies can bring
server libraries into the bundle, which production bundle checks reject.

## Changing a contract

Update both producer and consumer, including acknowledgement/error paths and
server validation. TypeScript alone does not validate untrusted network input.
Check backend types and affected tests; UI production checks verify browser bundle
boundaries. Schema changes to persisted data also need a
[database migration](../../docs/database-migrations.ru.md) where applicable.
