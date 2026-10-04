# Persistent room chat

[Documentation index](README.md) · [Architecture](architecture.md)

Text and sticker messages are stored in MongoDB independently of room snapshots.
A room archive remains readable after a backend restart. Connected, signed-in
users subscribed to an existing live or archived room can send messages;
membership is rechecked before persistence.

## Storage and delivery

`ChatRepository` uses `room_chat_messages` and `room_chat_imports`. Loading an old
archive imports its embedded history with stable IDs; repeated or interrupted
imports do not duplicate entries. Reads return the latest 1000 messages in
chronological order. That read limit is not a TTL or deletion policy.

Text is trimmed, must be nonempty and allows at most 2000 characters. Optional
client `requestID` values are bounded to 100 characters and deduplicated by room,
author and request ID. Retrying an acknowledged text message refreshes history
without emitting a new-message reaction again. Sticker delivery shares persistence
and permission checks; reaction-on-board depends on the sender being a live player
in the current room.

The service serializes operations within each room in a backend process and uses
MongoDB upserts for durable deduplication. A successful acknowledgement means
persistence succeeded. Storage failures surface as `failed`; unauthorized access
returns `notInRoom`, invalid payloads return `invalidMessage`.

## Contracts and checks

`ChatMessage` and Socket.IO events are in `packages/types/room.ts` and `api/sockets.ts`.
Implementation is in `packages/backend/src/room/chat-*`; sticker endpoints remain
in `packages/backend/src/stickers`.

```sh
npm run test --workspace=packages/backend -- --runInBand src/room
npm test --workspace=packages/ui
```

AI public chat uses this storage too; private model notes are separate.
Persisting chat does not restore an interrupted active game.
