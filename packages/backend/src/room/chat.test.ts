import { Chat } from './chat';

test('assigns stable IDs and retries do not append duplicates', () => {
  const chat = new Chat();
  const first = chat.addMessage(' hello ', 'alice', 'request-1');
  expect(first.message).toBe('hello');
  expect(first.id).toBeTruthy();
  expect(chat.addMessage(' hello ', 'alice', 'request-1')).toBe(first);
  expect(chat.history).toHaveLength(1);
  expect(chat.addMessage('hello', 'bob', 'request-1').id).not.toBe(first.id);
});

test('rejects empty and oversized messages without changing history', () => {
  const chat = new Chat();
  expect(() => chat.addMessage('  ', 'alice', '1')).toThrow();
  expect(() => chat.addMessage('a'.repeat(2001), 'alice', '2')).toThrow();
  expect(chat.history).toHaveLength(0);
});

test('retains only recent messages and releases their old deduplication entries', () => {
  const chat = new Chat();
  const first = chat.addMessage('first', 'alice', '0');
  for (let i = 1; i <= 1000; i++) chat.addMessage(`message ${i}`, 'alice', String(i));
  expect(chat.history).toHaveLength(1000);
  expect(chat.history[0].message).toBe('message 1');
  expect(chat.addMessage('first', 'alice', '0').id).not.toBe(first.id);
  expect(chat.history).toHaveLength(1000);
});
