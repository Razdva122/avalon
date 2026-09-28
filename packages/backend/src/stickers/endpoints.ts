import { roomChannel } from '@/helpers/channels';
import type { ServerSocket } from '@avalon/types';
import type { ChatService } from '@/room/chat-service';
import { validID } from '@/security/validation';
import { StickersManager } from './index';

export function registerStickerEndpoints(
  socket: ServerSocket,
  userID: string,
  manager: StickersManager,
  chat: Pick<ChatService, 'sendSticker'>,
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
    const allowed = () => socket.connected !== false && socket.rooms.has(roomChannel(uuid));
    if (!validID(uuid) || !allowed()) {
      cb({ error: 'notInRoom' });
      return;
    }
    try {
      cb(await manager.authorizeSend(userID, stickerID, () => chat.sendSticker(uuid, userID, stickerID, allowed)));
    } catch {
      cb({ error: 'failed' });
    }
  });
}
