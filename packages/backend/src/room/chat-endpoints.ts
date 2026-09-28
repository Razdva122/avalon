import { roomChannel } from '@/helpers/channels';
import type { ServerSocket } from '@avalon/types';
import { validID } from '@/security/validation';
import type { ChatService } from './chat-service';

export function registerChatEndpoints(socket: ServerSocket, userID: string, chat: Pick<ChatService, 'sendText'>) {
  socket.on('sendMessage', async (uuid, message, requestID, callback) => {
    const reply = typeof callback === 'function' ? callback : undefined;
    const allowed = () => socket.connected !== false && socket.rooms.has(roomChannel(uuid));
    if (!validID(uuid) || !allowed()) {
      reply?.({ error: 'notInRoom' });
      return;
    }
    if (requestID !== undefined && (typeof requestID !== 'string' || requestID.length > 100)) {
      reply?.({ error: 'invalidMessage' });
      return;
    }
    try {
      const entry = await chat.sendText(uuid, userID, message, requestID, allowed);
      reply?.({ message: entry });
    } catch (error) {
      const code =
        error instanceof Error && (error.message === 'invalidMessage' || error.message === 'notInRoom')
          ? error.message
          : 'failed';
      if (reply) reply({ error: code });
      else socket.emit('serverError', code);
    }
  });
}
