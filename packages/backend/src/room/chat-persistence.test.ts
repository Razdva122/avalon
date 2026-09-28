import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { MongoClient, Db } from 'mongodb';
import type { ChatMessage, Server, TRoomState } from '@avalon/types';
import { ChatRepository } from './chat-repository';
import { ChatService } from './chat-service';
import { Room } from './index';
import { registerChatEndpoints } from './chat-endpoints';
import type { ServerSocket } from '@avalon/types';

let server: MongoMemoryServer;
let client: MongoClient;
let db: Db;
beforeAll(async () => {
  server = await MongoMemoryServer.create();
  client = await MongoClient.connect(server.getUri());
  db = client.db('chat');
});
beforeEach(async () => {
  await db.dropDatabase();
});
afterEach(() => jest.restoreAllMocks());
afterAll(async () => {
  await client?.close();
  await server?.stop();
});

const legacy: ChatMessage[] = [
  { userID: 'alice', message: 'before archival', timestamp: 10 },
  { id: 'sticker-old', kind: 'sticker', userID: 'bob', message: 'merlin', stickerID: 'merlin', timestamp: 20 },
];

function fixture() {
  const events: { event: string; value: any; chatOnly?: boolean }[] = [];
  const io = {
    to: () => io,
    except: () => io,
    emit: (event: string, value: unknown, chatOnly?: boolean) => events.push({ event, value, chatOnly }),
  };
  const rooms: Record<string, Room> = {};
  const archive = { roomID: 'archive', chat: legacy, stage: 'started', players: [] } as unknown as TRoomState;
  const repo = new ChatRepository(db);
  const service = new ChatService(
    repo,
    (id) => rooms[id],
    async (id) => (id === 'archive' ? archive : null),
    io as unknown as Server,
  );
  return { repo, service, rooms, io: io as unknown as Server, events };
}

test('archived chat survives a service restart, including text and stickers sent after archival', async () => {
  const first = fixture();
  const text = await first.service.sendText('archive', 'alice', ' after archival ', 'request', () => true);
  await first.service.sendSticker('archive', 'alice', 'merlin', () => true);
  const restarted = fixture();
  const history = await restarted.service.history('archive', legacy);
  expect(history.map((entry) => entry.message)).toEqual(['before archival', 'merlin', 'after archival', 'merlin']);
  expect(history[2].id).toBe(text.id);
  expect(
    first.events.some(
      ({ event, value, chatOnly }) =>
        event === 'roomUpdated' && chatOnly === true && value.archived && value.chat.length === 4,
    ),
  ).toBe(true);
});

test('concurrent retries across repositories keep one message and preserve the first content', async () => {
  const first = fixture();
  const entry: ChatMessage = {
    id: 'first',
    userID: 'alice',
    requestID: 'retry',
    message: 'first content',
    timestamp: 30,
  };
  await first.repo.append('archive', entry);
  await Promise.all(
    Array.from({ length: 8 }, () =>
      new ChatRepository(db).append('archive', { ...entry, id: 'other', message: 'changed' }),
    ),
  );
  expect(await first.repo.history('archive')).toEqual([entry]);
  await first.repo.append('archive', { ...entry, id: 'bob', userID: 'bob' });
  await first.repo.append('other', entry);
  expect(await first.repo.history('archive')).toHaveLength(2);
  expect(await first.repo.history('other')).toHaveLength(1);
});

test('legacy import is repeatable and does not duplicate messages already saved by request ID', async () => {
  const { repo } = fixture();
  const withRequest = { id: 'new', requestID: 'req', userID: 'alice', message: 'text', timestamp: 30 };
  await repo.append('archive', withRequest);
  await Promise.all([
    repo.importHistory('archive', [...legacy, withRequest]),
    repo.importHistory('archive', [...legacy, withRequest]),
  ]);
  expect((await repo.history('archive')).map((m) => m.message)).toEqual(['before archival', 'merlin', 'text']);
});

test('history reads retain the latest 1000 messages without deleting older stored messages', async () => {
  const { repo } = fixture();
  await repo.importHistory(
    'archive',
    Array.from({ length: 1002 }, (_, i) => ({ id: String(i), userID: 'alice', message: String(i), timestamp: i })),
  );
  const history = await repo.history('archive');
  expect(history).toHaveLength(1000);
  expect(history[0].message).toBe('2');
  expect(history[999].message).toBe('1001');
  expect(await db.collection('room_chat_messages').countDocuments()).toBe(1002);
});

test('failed writes do not broadcast or append to the live room, and a retry succeeds', async () => {
  const { service, repo, rooms, io, events } = fixture();
  rooms.live = new Room('live', 'alice', ['alice'], io);
  const failure = jest.spyOn(repo, 'append').mockRejectedValueOnce(Error('database unavailable'));
  await expect(service.sendText('live', 'alice', 'hello', 'req', () => true)).rejects.toThrow();
  expect(rooms.live.chat.history).toHaveLength(0);
  expect(events).toHaveLength(0);
  failure.mockRestore();
  await service.sendText('live', 'alice', 'hello', 'req', () => true);
  expect(rooms.live.chat.history.map((m) => m.message)).toEqual(['hello']);
});

test('leaving while archive lookup is pending rejects the send; unknown rooms cannot create chats', async () => {
  const { service, repo, events } = fixture();
  await expect(service.sendText('archive', 'alice', 'hello', 'req', () => false)).rejects.toThrow('notInRoom');
  await expect(service.sendText('missing', 'alice', 'hello', 'req', () => true)).rejects.toThrow('notInRoom');
  expect(await repo.history('archive')).toEqual([]);
  expect(events).toHaveLength(0);
});

test('archive endpoint acknowledges only durable writes and reports storage failures', async () => {
  const { service, repo } = fixture();
  let send: (...args: any[]) => Promise<void> = async () => {};
  const socket = {
    connected: true,
    rooms: new Set(['room:archive']),
    on: (_event: string, handler: typeof send) => {
      send = handler;
    },
  } as unknown as ServerSocket;
  registerChatEndpoints(socket, 'alice', service);
  const replies: unknown[] = [];
  const reply = (result: unknown) => replies.push(result);
  await send('archive', 'hello', 'req', reply);
  expect(replies).toEqual([{ message: expect.objectContaining({ message: 'hello', requestID: 'req' }) }]);
  expect((await new ChatRepository(db).history('archive')).slice(-1)[0]?.message).toBe('hello');
  jest.spyOn(repo, 'append').mockRejectedValueOnce(Error('offline'));
  await send('archive', 'not stored', 'another', reply);
  expect(replies[replies.length - 1]).toEqual({ error: 'failed' });
  expect((await repo.history('archive')).some((entry) => entry.message === 'not stored')).toBe(false);
});

test('leaving during archive lookup prevents storage and broadcasting', async () => {
  const { repo, io, events } = fixture();
  let resolve!: (state: TRoomState) => void;
  let joined = true;
  const service = new ChatService(
    repo,
    () => undefined,
    () =>
      new Promise((done) => {
        resolve = done;
      }),
    io,
  );
  const sending = service.sendText('archive', 'alice', 'hello', 'req', () => joined);
  await Promise.resolve();
  await Promise.resolve();
  joined = false;
  resolve({ roomID: 'archive', chat: [] } as unknown as TRoomState);
  await expect(sending).rejects.toThrow('notInRoom');
  expect(await repo.history('archive')).toEqual([]);
  expect(events).toEqual([]);
});

test('a committed message can be retried after history read failure without duplication or repeated board reactions', async () => {
  const { service, repo, events } = fixture();
  jest.spyOn(repo, 'history').mockRejectedValueOnce(Error('read failed'));
  await expect(service.sendText('archive', 'alice', 'hello', 'req', () => true)).rejects.toThrow();
  await service.sendText('archive', 'alice', 'hello', 'req', () => true);
  await service.sendText('archive', 'alice', 'hello', 'req', () => true);
  expect((await repo.history('archive')).filter((entry) => entry.message === 'hello')).toHaveLength(1);
  expect(events.filter(({ event }) => event === 'newMessage')).toHaveLength(0);
  expect(events.filter(({ event }) => event === 'roomUpdated')).toHaveLength(2);
});
