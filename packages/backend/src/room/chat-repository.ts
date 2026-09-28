import { createHash, randomUUID } from 'crypto';
import { ObjectId } from 'mongodb';
import type { Db } from 'mongodb';
import type { ChatMessage } from '@avalon/types';

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
type StoredMessage = { _id: string; roomID: string; timestamp: number; order: ObjectId; entry: ChatMessage };

export class ChatRepository {
  private messages;
  private imports;

  constructor(db: Db) {
    this.messages = db.collection<StoredMessage>('room_chat_messages');
    this.imports = db.collection<{ _id: string; fingerprint: string }>('room_chat_imports');
  }

  private document(roomID: string, message: ChatMessage): StoredMessage {
    const entry = { ...message, id: message.id || randomUUID() };
    const key = entry.requestID ? ['request', roomID, entry.userID, entry.requestID] : ['message', roomID, entry.id];
    return { _id: digest(key), roomID, timestamp: entry.timestamp, order: new ObjectId(), entry };
  }

  async append(roomID: string, entry: ChatMessage): Promise<ChatMessage> {
    const document = this.document(roomID, entry);
    try {
      const stored = await this.messages.findOneAndUpdate(
        { _id: document._id },
        { $setOnInsert: document },
        { upsert: true, returnDocument: 'after' },
      );
      return stored!.entry;
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      const stored = await this.messages.findOne({ _id: document._id });
      if (!stored) throw error;
      return stored.entry;
    }
  }

  async importHistory(roomID: string, history: ChatMessage[]): Promise<void> {
    if (!history.length) return;
    const fingerprint = digest(history);
    if ((await this.imports.findOne({ _id: roomID }))?.fingerprint === fingerprint) return;
    // Stable IDs let interrupted/concurrent imports resume without duplicating legacy entries.
    const documents = history.map((entry, index) =>
      this.document(roomID, {
        ...entry,
        id: entry.id || `legacy-${digest([roomID, index, entry])}`,
      }),
    );
    await this.messages.bulkWrite(
      documents.map((document) => ({
        updateOne: {
          filter: { _id: document._id },
          update: { $setOnInsert: document },
          upsert: true,
        },
      })),
      { ordered: true },
    );
    await this.imports.updateOne({ _id: roomID }, { $set: { fingerprint } }, { upsert: true });
  }

  async history(roomID: string): Promise<ChatMessage[]> {
    const messages = await this.messages
      .find({ roomID })
      .sort({ timestamp: -1, order: -1 })
      .limit(1000)
      .maxTimeMS(10000)
      .toArray();
    return messages.reverse().map(({ entry }) => entry);
  }
}
