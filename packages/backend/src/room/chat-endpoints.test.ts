import { registerChatEndpoints } from './chat-endpoints';
import { Chat } from './chat';
import type { ServerSocket } from '@avalon/types';
function setup(joined = true) {
  let send: (...args: any[]) => Promise<void> | void = () => {};
  const chat = new Chat();
  const addMessage = jest.fn((user: string, text: string, request?: string) => chat.addMessage(text, user, request));
  const socket = {
    rooms: new Set(joined ? ['room:room'] : []),
    on: (_event: string, handler: typeof send) => (send = handler),
  };
  registerChatEndpoints(socket as unknown as ServerSocket, 'alice', {
    sendText: async (id, user, text, request) => {
      if (id !== 'room') throw Error('notInRoom');
      return addMessage(user, text, request);
    },
  });
  return { send, chat, addMessage };
}
test('acknowledges stored messages, and old clients without ack still send', async () => {
  const { send, chat } = setup();
  const reply = jest.fn();
  await send('room', 'hello', 'id', reply);
  expect(reply).toHaveBeenCalledWith({ message: chat.history[0] });
  await send('room', 'legacy');
  expect(chat.history).toHaveLength(2);
});
test('rejects sends from outside the room and malformed requests', async () => {
  const outside = setup(false),
    inside = setup();
  const reply = jest.fn();
  await outside.send('room', 'hello', 'id', reply);
  expect(reply).toHaveBeenLastCalledWith({ error: 'notInRoom' });
  expect(outside.addMessage).not.toHaveBeenCalled();
  await inside.send('room', 'hello', {}, reply);
  expect(reply).toHaveBeenLastCalledWith({ error: 'invalidMessage' });
  await inside.send('room', '   ', 'id', reply);
  expect(reply).toHaveBeenLastCalledWith({ error: 'invalidMessage' });
  expect(inside.chat.history).toHaveLength(0);
});
