import { handleSocketErrors } from './socket';
import type { ServerSocket } from '@avalon/types';

function fixture() {
  const handlers: Record<string, (...args: unknown[]) => unknown> = {};
  const emitted: unknown[][] = [];
  const socket = {
    on: (event: string, handler: (...args: unknown[]) => unknown) => {
      handlers[event] = handler;
      return socket;
    },
    emit: (...args: unknown[]) => emitted.push(args),
  };
  handleSocketErrors(socket as unknown as ServerSocket);
  return { socket, handlers, emitted };
}

test('rejects arrays and Mongo operators before the room handler sees them', () => {
  const { socket, handlers } = fixture();
  let joined = false;
  socket.on('joinRoom', () => {
    joined = true;
  });
  const reply = jest.fn();
  handlers.joinRoom(['saved-room', 'victim'], reply);
  handlers.joinRoom({ $ne: null }, reply);
  handlers.joinRoom('__proto__', reply);
  expect(joined).toBe(false);
  expect(reply).toHaveBeenCalledWith({ error: 'invalidRequest' });
});

test('missing or misplaced acknowledgement cannot reach a database handler', () => {
  const { socket, handlers } = fixture();
  let calls = 0;
  socket.on('getAllAchievements', () => {
    calls++;
  });
  handlers.getAllAchievements();
  handlers.getAllAchievements('not-a-function');
  expect(calls).toBe(0);
  handlers.getAllAchievements(() => {});
  expect(calls).toBe(1);
});

test('handles rejected async operations without disclosing internal error messages', async () => {
  const { socket, handlers, emitted } = fixture();
  socket.on('updateUserName', async () => {
    throw Error('mongodb://private credentials');
  });
  await handlers.updateUserName('Alice');
  expect(emitted).toContainEqual(['serverError', 'requestFailed']);
  expect(JSON.stringify(emitted)).not.toContain('credentials');
});

test('allows valid room IDs and legacy chat without acknowledgements', () => {
  const { socket, handlers } = fixture();
  let calls = 0;
  socket.on('joinRoom', () => {
    calls++;
  });
  socket.on('sendMessage', () => {
    calls++;
  });
  handlers.joinRoom('00000000-0000-4000-8000-000000000001', () => {});
  handlers.sendMessage('room', 'hello');
  expect(calls).toBe(2);
});
