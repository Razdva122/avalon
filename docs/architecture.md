# Architecture and data flow

[Documentation index](README.md) · [Development guide](development.md)

## Runtime

The Vue UI communicates with the Express backend through typed Socket.IO events
for rooms/games/accounts and HTTP routes for recovery, support and community boards.
In development these run on ports 8080 and 3000. Production nginx serves the static
UI and proxies application traffic. MongoDB stores accounts, completed games,
ratings, achievements, chat, feature queues and AI diagnostics.

The backend runs TypeScript with ts-node; there is no separate backend compilation
step in the production startup script. Shared contracts live in `@avalon/types`.
Runtime validation and authorization remain backend responsibilities.

## Game lifecycle

`main/Manager` coordinates rooms, connections and feature services. `room` owns
room membership and state; `core/game-manager` and `core/game` execute observable
stages for team selection, voting, missions, addon actions and assassination.
Socket broadcasts use separate `room:<id>` and `user:<id>` channels.
Completed games are archived, then durable rating operations update statistics
and achievements. [Database migrations](database-migrations.ru.md) and required
indexes finish before HTTP service starts.

Live room/game coordination is held in process memory. Persistence of completed
games and chat does not make active games survive a restart. Deploy only during
an idle window; adding backend replicas requires considering room ownership,
socket routing and every worker's concurrency semantics.

## Feature services

| Feature                       | Backend                   | Guide                                                          |
| ----------------------------- | ------------------------- | -------------------------------------------------------------- |
| Persistent text/stickers      | `room/chat-*`, `stickers` | [Chat](room-chat.md)                                           |
| Bot games and profile pool    | `ai`                      | [AI Arena](ai-rooms.md)                                        |
| Voice gateway and tokens      | `voice`                   | [Voice](voice-chat.md)                                         |
| Recovery and encrypted outbox | `recovery`                | [Recovery](password-recovery.md)                               |
| Blockchain verification       | `support/direct`          | [Support](payments/direct-crypto.md)                           |
| Public listings/moderation    | `player-boards`           | [Boards](player-boards.md)                                     |
| Progress and unlocks          | `achievements`            | [Achievements](../packages/backend/src/achievements/README.md) |

Optional providers are enabled through environment configuration. AI management
and board moderation check the account's database `isAdmin` flag. ChatGPT auth,
SMTP credentials, LiveKit secrets and blockchain RPC keys remain server-side.

## UI and publication

Vue Router uses canonical localized URLs for public articles and neutral URLs for
private/game pages. Build-time prerendering includes article content and metadata;
selected dictionaries load lazily. [Localization](../packages/ui/src/i18n/README.md)
and [SEO](../packages/ui/SEO.md) describe these boundaries.

Original game artwork is tracked; previews/thumbnails are generated. Production
images use content-hashed immutable URLs in Yandex Storage. JS, CSS and fonts stay
on the UI host. The release workflow verifies exported HTML and uploaded images
before packaging that same UI build. See [release operations](../deploy/README.md).
