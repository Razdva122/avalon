import type { ChatMessage } from '@avalon/types';
import { randomUUID } from 'crypto';

export class Chat {
  history: ChatMessage[] = [];
  private requests = new Map<string, ChatMessage>();

  append(entry: ChatMessage): void {
    this.history.push(entry);
    if (entry.requestID) this.requests.set(JSON.stringify([entry.userID, entry.requestID]), entry);
    while (this.history.length > 1000) {
      const removed = this.history.shift()!;
      if (removed.requestID) this.requests.delete(JSON.stringify([removed.userID, removed.requestID]));
    }
  }

  addMessage(message: string, userID: string, requestID?: string): ChatMessage {
    if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
      throw new Error('invalidMessage');
    }
    const key = requestID ? JSON.stringify([userID, requestID]) : undefined;
    if (key && this.requests.has(key)) return this.requests.get(key)!;
    const entry: ChatMessage = {
      id: randomUUID(),
      requestID,
      kind: 'text',
      message: message.trim(),
      userID,
      timestamp: Date.now(),
    };
    this.append(entry);
    return entry;
  }
}
