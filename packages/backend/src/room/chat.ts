import type { ChatMessage } from '@avalon/types';

export class Chat {
  history: ChatMessage[] = [];

  addMessage(message: string, userID: string, userName: string) {
    this.history.push({
      message,
      user: {
        id: userID,
        name: userName,
      },
      timestamp: Date.now(),
    });
  }
}
