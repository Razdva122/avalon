import { registerChatEndpoints } from './chat-endpoints';
import { Chat } from './chat';
import type { ServerSocket } from '@avalon/types';
import type { Room } from './index';
function setup(joined = true) {
  let send: (...args: any[]) => void = () => {};
  const chat = new Chat();
  const addMessage = jest.fn((user: string, text: string, request?: string) => chat.addMessage(text, user, request));
  const socket = {
    rooms: new Set(joined ? ['room'] : []),
    on: (_event: string, handler: typeof send) => (send = handler),
  };
  registerChatEndpoints(socket as unknown as ServerSocket, 'alice', (id) =>
    id === 'room' ? ({ addMessage } as unknown as Room) : undefined,
  );
  return { send, chat, addMessage };
}
test('acknowledges stored messages, and old clients without ack still send', () => {
  const { send, chat } = setup();
  const reply = jest.fn();
  send('room', 'hello', 'id', reply);
  expect(reply).toHaveBeenCalledWith({ message: chat.history[0] });
  send('room', 'legacy');
  expect(chat.history).toHaveLength(2);
});
test('rejects sends from outside the room and malformed requests', () => {
  const outside = setup(false),
    inside = setup();
  const reply = jest.fn();
  outside.send('room', 'hello', 'id', reply);
  expect(reply).toHaveBeenLastCalledWith({ error: 'notInRoom' });
  expect(outside.addMessage).not.toHaveBeenCalled();
  inside.send('room', 'hello', {}, reply);
  expect(reply).toHaveBeenLastCalledWith({ error: 'invalidMessage' });
  inside.send('room', '   ', 'id', reply);
  expect(reply).toHaveBeenLastCalledWith({ error: 'invalidMessage' });
  expect(inside.chat.history).toHaveLength(0);
});
