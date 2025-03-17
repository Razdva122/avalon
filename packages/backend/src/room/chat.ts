import type { ChatMessage } from '@avalon/types';

export class Chat {
  history: ChatMessage[] = [];

  addMessage(message: string, userID: string) {
    this.history.push({
      message,
      userID,
      timestamp: Date.now(),
    });
  }
}
