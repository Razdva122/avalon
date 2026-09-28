import { randomUUID } from 'crypto';
import type { ChatMessage, Server, TRoomState } from '@avalon/types';
import { publicRoomState } from '@/ai/public-state';
import { roomChannel } from '@/helpers/channels';
import { validID } from '@/security/validation';
import type { Room } from './index';
import { Chat } from './chat';
import type { ChatRepository } from './chat-repository';

export class ChatService {
  private pending = new Map<string, Promise<unknown>>();

  constructor(
    private repository: ChatRepository | undefined,
    private getRoom: (id: string) => Room | undefined,
    private getArchive: (id: string) => Promise<TRoomState | null | undefined>,
    private io: Server,
  ) {}

  private async ordered<T>(id: string, action: () => Promise<T>): Promise<T> {
    const previous = this.pending.get(id) || Promise.resolve();
    const current = previous.catch(() => {}).then(action);
    this.pending.set(id, current);
    try {
      return await current;
    } finally {
      if (this.pending.get(id) === current) this.pending.delete(id);
    }
  }

  history(id: string, legacy: ChatMessage[] = []): Promise<ChatMessage[]> {
    return this.ordered(id, async () => {
      if (!this.repository) return legacy;
      await this.repository.importHistory(id, legacy);
      const history = await this.repository.history(id);
      this.cache(id, history);
      return history;
    });
  }

  private cache(id: string, history: ChatMessage[]) {
    const room = this.getRoom(id);
    if (room) {
      room.chat = new Chat();
      history.forEach((entry) => room.chat.append(entry));
    }
  }

  sendText(
    id: string,
    userID: string,
    text: string,
    requestID: string | undefined,
    allowed: () => boolean,
  ): Promise<ChatMessage> {
    if (
      typeof text !== 'string' ||
      !text.trim() ||
      text.length > 2000 ||
      (requestID !== undefined && (typeof requestID !== 'string' || !requestID.length || requestID.length > 100))
    ) {
      return Promise.reject(Error('invalidMessage'));
    }
    return this.send(
      id,
      { id: randomUUID(), kind: 'text', userID, message: text.trim(), requestID, timestamp: Date.now() },
      allowed,
    );
  }

  async sendSticker(id: string, userID: string, stickerID: string, allowed: () => boolean): Promise<void> {
    await this.send(
      id,
      { id: randomUUID(), kind: 'sticker', userID, stickerID, message: stickerID, timestamp: Date.now() },
      allowed,
    );
  }

  private send(id: string, entry: ChatMessage, allowed: () => boolean): Promise<ChatMessage> {
    if (!validID(id) || !allowed()) return Promise.reject(Error('notInRoom'));
    return this.ordered(id, async () => {
      const room = this.getRoom(id);
      const archive = room ? undefined : await this.getArchive(id);
      if ((!room && !archive) || !allowed()) throw Error('notInRoom');
      if (!this.repository) throw Error('failed');
      if (archive) await this.repository.importHistory(id, archive.chat || []);
      if (!allowed()) throw Error('notInRoom');
      const stored = await this.repository.append(id, entry);
      const history = await this.repository.history(id);
      this.cache(id, history);
      const live = this.getRoom(id);
      if (live) live.updateRoomState(true, true);
      else {
        const saved = archive || (await this.getArchive(id));
        if (saved)
          this.io
            .to(roomChannel(id))
            .emit('roomUpdated', publicRoomState({ ...saved, chat: history, archived: true }), true);
      }
      // Refresh history on retries, but do not replay board reactions for an old message.
      if (stored.id !== entry.id) return stored;
      if (stored.kind === 'sticker') {
        this.io.to(roomChannel(id)).emit('stickerSent', {
          id: stored.id!,
          roomID: id,
          userID: stored.userID,
          timestamp: stored.timestamp,
          stickerID: stored.stickerID!,
          showOnBoard: Boolean(live && !live.nextRoomID && live.players.includes(stored.userID)),
        });
      } else {
        this.io
          .to(roomChannel(id))
          .emit('newMessage', { id: stored.id, roomID: id, text: stored.message, author: stored.userID });
      }
      return stored;
    });
  }
}
