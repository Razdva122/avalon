import crypto from 'crypto';
import type { Server, ServerSocket } from '@avalon/types';
import type { Room } from '@/room';
import { StickersManager } from './index';

export function registerStickerEndpoints(
  socket: ServerSocket,
  userID: string,
  manager: StickersManager,
  getRoom: (id: string) => Room | undefined,
  io: Server,
): void {
  socket.on('getMyStickers', async (cb) => {
    try {
      cb(await manager.collection(userID));
    } catch {
      cb({ error: 'failed' });
    }
  });
  socket.on('updateStickerPreferences', async (favorites, hideOnBoard, cb) => {
    try {
      cb(await manager.preferences(userID, favorites, hideOnBoard));
    } catch {
      cb({ error: 'failed' });
    }
  });
  socket.on('markStickersSeen', async (ids, cb) => {
    try {
      if (!Array.isArray(ids) || ids.length > 12 || ids.some((id) => typeof id !== 'string')) {
        cb({ error: 'invalid' });
        return;
      }
      await manager.seen(userID, ids);
      cb(true);
    } catch {
      cb({ error: 'failed' });
    }
  });
  socket.on('sendSticker', async (uuid, stickerID, cb) => {
    const room = getRoom(uuid);
    if (!room || !socket.rooms.has(uuid)) {
      cb({ error: 'notInRoom' });
      return;
    }
    try {
      cb(
        await manager.authorizeSend(userID, stickerID, () => {
          if (getRoom(uuid) !== room || !socket.rooms.has(uuid)) throw new Error('Room left');
          const message = {
            id: crypto.randomUUID(),
            roomID: uuid,
            userID,
            timestamp: Date.now(),
            stickerID,
            showOnBoard:
              room.data.stage === 'started'
                ? room.data.manager.game.players.some((p) => p.userID === userID)
                : room.players.includes(userID),
          };
          room.chat.history.push({
            id: message.id,
            kind: 'sticker',
            stickerID,
            userID,
            timestamp: message.timestamp,
            message: stickerID,
          });
          io.to(uuid).emit('stickerSent', message);
        }),
      );
    } catch {
      cb({ error: 'failed' });
    }
  });
}
