import { ref } from 'vue';
import type { ChatMessage, ChatSendResult } from '@avalon/types';

export type OutgoingMessage = ChatMessage & { requestID: string; status: 'sending' | 'failed' | 'sent' };
export const messageKey = (message: ChatMessage, index: number) => message.id ?? `legacy-${index}-${message.timestamp}`;
export function groupMessages(messages: ChatMessage[], boundary?: string) {
  const groups: { userID: string; key: string; entries: { message: ChatMessage; key: string }[] }[] = [];
  messages.forEach((message, index) => {
    const key = messageKey(message, index);
    const last = groups[groups.length - 1];
    const previous = last?.entries[last.entries.length - 1].message;
    if (
      !last ||
      last.userID !== message.userID ||
      key === boundary ||
      !previous ||
      message.timestamp - previous.timestamp > 120000 ||
      new Date(message.timestamp).toDateString() !== new Date(previous.timestamp).toDateString()
    ) {
      groups.push({ userID: message.userID, key, entries: [] });
    }
    groups[groups.length - 1].entries.push({ message, key });
  });
  return groups;
}

export function useRoomChat(
  userID: () => string | undefined,
  deliver: (text: string, requestID: string) => Promise<ChatSendResult>,
) {
  const unread = ref<string[]>([]);
  const outbox = ref<OutgoingMessage[]>([]);
  let known = new Set<string>();
  let initialized = false;
  let generation = 0;
  const receive = (messages: ChatMessage[]) => {
    const keys = messages.map(messageKey);
    if (initialized) {
      messages.forEach((message, index) => {
        if (!known.has(keys[index]) && message.userID !== userID()) unread.value.push(keys[index]);
      });
    }
    const present = new Set(keys);
    unread.value = unread.value.filter((key) => present.has(key));
    known = present;
    initialized = true;
    outbox.value = outbox.value.filter(
      (local) =>
        !messages.some(
          (message) =>
            message.userID === local.userID && (message.requestID === local.requestID || message.id === local.id),
        ),
    );
  };
  const markRead = (keys: string[]) => {
    const visible = new Set(keys);
    unread.value = unread.value.filter((key) => !visible.has(key));
  };
  const retry = async (requestID: string) => {
    const entry = outbox.value.find((message) => message.requestID === requestID);
    if (!entry || entry.status === 'sending' || entry.status === 'sent') return;
    entry.status = 'sending';
    const current = generation;
    try {
      const result = await deliver(entry.message, requestID);
      if (current !== generation) return;
      if ('error' in result) entry.status = 'failed';
      else Object.assign(entry, result.message, { status: 'sent' });
    } catch {
      if (current === generation) entry.status = 'failed';
    }
  };
  const send = async (text: string) => {
    const author = userID();
    if (!text.trim() || text.length > 2000 || !author) return;
    const requestID = crypto.randomUUID();
    outbox.value.push({
      id: `local-${requestID}`,
      requestID,
      userID: author,
      message: text.trim(),
      timestamp: Date.now(),
      kind: 'text',
      status: 'failed',
    });
    await retry(requestID);
  };
  const reset = () => {
    generation++;
    unread.value = [];
    outbox.value = [];
    known = new Set();
    initialized = false;
  };
  return { unread, outbox, receive, markRead, send, retry, reset };
}
