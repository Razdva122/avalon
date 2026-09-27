import { Manager } from './index';
import { eventBus } from '@/helpers';
import type { Server, ServerSocket } from '@avalon/types';
import type { DBManager } from '@/db';

jest.mock('@/voice/runtime', () => ({
  createRoomVoice: () => ({ destroyRoom() {}, reconcile() {}, revokeSocket() {} }),
  registerVoiceEndpoints() {},
}));
jest.mock('@/ai/service', () => ({
  AiService: class {
    register() {}
  },
}));
jest.mock('@/achievements', () => ({ AchievementManager: class {} }));

function fixture(auth = false) {
  const connections: ((socket: unknown) => void)[] = [];
  const broadcasts: { channel: string; event: string; value: unknown }[] = [];
  const io = {
    use() {},
    except() {
      return io;
    },
    on(event: string, fn: (socket: unknown) => void) {
      if (event === 'connection') connections.push(fn);
    },
    to(channel: string) {
      return {
        emit(event: string, value: unknown) {
          broadcasts.push({ channel, event, value });
        },
      };
    },
  };
  const db = {
    getLastRooms: async () => [],
    getRoomFromDB: async () => ({ roomID: 'archive', stage: 'started' }),
    getUserCompletedAchievements: async () => [],
  };
  const manager = new Manager(io as unknown as Server, db as unknown as DBManager);
  const handlers: Record<string, (...args: unknown[]) => unknown> = {};
  const socket = {
    id: 'socket',
    data: auth ? { authUser: { id: 'alice' } } : {},
    rooms: new Set<string>(['socket']),
    on(event: string, fn: (...args: unknown[]) => unknown) {
      handlers[event] = fn;
      return socket;
    },
    emit() {},
    join(id: string) {
      socket.rooms.add(id);
    },
    leave(id: string) {
      socket.rooms.delete(id);
    },
  };
  connections[connections.length - 1](socket as unknown as ServerSocket);
  return { manager, handlers, socket, broadcasts };
}
beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  eventBus.removeAllListeners();
});

test('guest cannot subscribe arrays or private channel names; valid archives use room namespace', async () => {
  const { socket, handlers } = fixture();
  await handlers.joinRoom(['archive', 'alice'], () => {});
  await handlers.joinRoom('user:alice', () => {});
  expect([...socket.rooms]).toEqual(['socket']);
  await handlers.joinRoom('archive', () => {});
  expect([...socket.rooms]).toEqual(['socket', 'room:archive']);
});

test('authenticated users join only their namespaced personal channel', () => {
  expect([...fixture(true).socket.rooms]).toEqual(['socket', 'user:alice']);
});

test('joining twice and leaving another room cannot corrupt online counters', async () => {
  const { manager, handlers } = fixture();
  await handlers.joinRoom('archive', () => {});
  await handlers.joinRoom('archive', () => {});
  handlers.leaveRoom('other');
  expect(manager.onlineCounter.archive).toBe(1);
  handlers.leaveRoom('archive');
  expect(manager.onlineCounter.archive || 0).toBe(0);
});

test('one account cannot retain unlimited waiting rooms', () => {
  const { manager } = fixture(true);
  manager.createRoom('one', 'alice', ['alice']);
  manager.createRoom('two', 'alice', ['alice']);
  manager.createRoom('three', 'alice', ['alice']);
  expect(() => manager.createRoom('four', 'alice', ['alice'])).toThrow('roomLimit');
  expect(Object.keys(manager.rooms)).toHaveLength(3);
  manager.destroyRoom('one');
  expect(() => manager.createRoom('four', 'alice', ['alice'])).not.toThrow();
});

test('waiting rooms are actually released after idle TTL, not just hidden from lobby', () => {
  const { manager } = fixture();
  manager.createRoom('waiting', 'alice', ['alice']);
  jest.advanceTimersByTime(30 * 60000);
  expect(manager.rooms.waiting).toBeUndefined();
});

test('new chat messages still broadcast when bounded history is full; retries do not', () => {
  const { manager, broadcasts } = fixture();
  manager.createRoom('chat-room', 'alice', ['alice']);
  const room = manager.rooms['chat-room'];
  for (let i = 0; i < 1000; i++) room.chat.addMessage(`message ${i}`, 'alice', String(i));
  room.addMessage('alice', 'newest', 'new');
  room.addMessage('alice', 'newest', 'new');
  expect(room.chat.history).toHaveLength(1000);
  expect(broadcasts.filter((event) => event.event === 'newMessage')).toEqual([
    expect.objectContaining({ channel: 'room:chat-room', value: expect.objectContaining({ text: 'newest' }) }),
  ]);
});
