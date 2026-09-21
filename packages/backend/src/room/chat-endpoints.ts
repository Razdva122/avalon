import type { ServerSocket } from '@avalon/types';
import type { Room } from './index';

export function registerChatEndpoints(socket: ServerSocket, userID: string, getRoom: (id: string) => Room | undefined) {
  socket.on('sendMessage', (uuid, message, requestID, callback) => {
    const room = getRoom(uuid);
    const reply = typeof callback === 'function' ? callback : undefined;
    if (!room || !socket.rooms.has(uuid)) {
      reply?.({ error: 'notInRoom' });
      return;
    }
    if (requestID !== undefined && (typeof requestID !== 'string' || requestID.length > 100)) {
      reply?.({ error: 'invalidMessage' });
      return;
    }
    try {
      const entry = room.addMessage(userID, message, requestID);
      reply?.({ message: entry });
    } catch {
      reply?.({ error: 'invalidMessage' });
    }
  });
}
