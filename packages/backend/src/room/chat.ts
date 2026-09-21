import type { ChatMessage } from '@avalon/types';
import { randomUUID } from 'crypto';

export class Chat {
  history: ChatMessage[] = [];
  private requests = new Map<string, ChatMessage>();

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
    this.history.push(entry);
    if (key) this.requests.set(key, entry);
    return entry;
  }
}
