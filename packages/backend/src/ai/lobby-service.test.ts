/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Manager } from '@/main';
import { Room } from '@/room';
import { ChatService } from '@/room/chat-service';
import type { Server, ServerSocket } from '@avalon/types';
import { AiService } from './service';
import { BotRoom } from './room';
import type { AiRepository } from './repository';
import { defaultBotQuotaThresholds } from './quota-policy';
import * as limits from './codex-limits';
import * as catalog from './codex-models';
import * as support from '@/support/repository';
import { errorHandler } from '@/helpers/socket';

const environment = { ...process.env };
beforeEach(() => {
  process.env.NODE_ENV = 'development';
  process.env.AI_CODEX_ENABLED = 'true';
  delete process.env.AI_CODEX_INSTANCES;
  jest.spyOn(support, 'supportTotalCents').mockResolvedValue(0);
  jest.spyOn(limits, 'getCodexWeeklyLimit').mockResolvedValue({
    remainingPercent: 80,
    resetsAt: null,
    checkedAt: Date.now(),
    shortTerm: null,
  });
  jest.spyOn(catalog, 'getCodexModels').mockResolvedValue([
    { id: 'gpt-6.1-sol', label: 'Sol', efforts: ['medium'] },
    { id: 'gpt-6.1-terra', label: 'Terra', efforts: ['medium'] },
  ]);
  // Keep the real game/roles engine, but never spend model requests or start action timers.
  jest.spyOn(BotRoom.prototype, 'run').mockImplementation(async function (this: BotRoom) {
    this.ai!.status = 'running';
    if (this.data.stage !== 'started') Room.prototype.startGame.call(this);
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  process.env = { ...environment };
});

function fixture(humans = ['owner'], registrationDate?: string) {
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const host = {
    rooms: Object.create(null),
    io,
    createRoom: (id: string, owner: string, humans: string[]) => {
      host.rooms[id] = new Room(id, owner, [...humans], io);
    },
    destroyRoom: (id: string) => {
      delete host.rooms[id];
    },
    updateRoomsList: () => {},
    dbManager: {
      getUserByID: async (id: string) => {
        if (id === 'missing') throw Error('missing');
        return { id, name: id };
      },
      getUserRegistrationDate: async (id: string) => (id === humans[0] ? registrationDate : undefined),
      getUserFeatures: async (id: string) => (id === 'premium' ? { premiumGrantedAt: new Date() } : {}),
    },
  } as unknown as Manager;
  const lobby = new Room('lobby-id', humans[0], [...humans], io);
  host.rooms[lobby.roomID] = lobby;
  const service = new AiService(host);
  const held = new Set<string>();
  const weeklyReplays = new Map<string, string[]>();
  service.repository = {
    weeklyGamesUsed: async (owner: string) => weeklyReplays.get(owner)?.length ?? 0,
    commitWeeklyStart: async (state: { leaderID: string; roomID: string }, _week: number, limit: number) => {
      const existing = weeklyReplays.get(state.leaderID) ?? [];
      if (existing.length >= limit) return false;
      weeklyReplays.set(state.leaderID, [...existing, state.roomID]);
      return true;
    },
    getBotQuotaThresholds: async () => structuredClone(defaultBotQuotaThresholds),
    claim: async (id: string) => {
      held.add(id);
    },
    release: async (id: string) => {
      held.delete(id);
    },
    save: async () => {},
    renewLease: async () => {},
    busyInstances: async () => [],
  } as unknown as AiRepository;
  const connect = (user?: string) => {
    const handlers: Record<string, (...args: any[]) => Promise<void>> = {};
    service.register(
      {
        on: (event: string, handler: any) => {
          handlers[event] = errorHandler(handler, { emit: () => {} } as unknown as ServerSocket, event);
        },
      } as unknown as ServerSocket,
      user,
    );
    return handlers;
  };
  const start = async (
    user = humans[0],
    options: any = { playerCount: 5, language: 'en', humanPlayerIDs: [...humans] },
  ) => {
    const cb = jest.fn();
    await connect(user).startLobbyAiRoom('lobby-id', options, cb);
    return cb.mock.calls[0]?.[0];
  };
  return { host, lobby, service, held, connect, start, weeklyReplays };
}

test('host access reports strong availability and the current confirmed roster', async () => {
  const f = fixture(['premium', 'friend']);
  const cb = jest.fn();
  expect(f.connect('premium').getLobbyAiAccess).toEqual(expect.any(Function));
  await f.connect('premium').getLobbyAiAccess('lobby-id', cb);
  expect(cb).toHaveBeenCalledWith({ available: true, hostPremium: true, humanPlayerIDs: ['premium', 'friend'] });
  await f.connect('friend').getLobbyAiAccess('lobby-id', cb);
  expect(cb.mock.calls.at(-1)?.[0]).toHaveProperty('error');
  expect(f.held.size).toBe(0);
});

test('launch adopts identity, creation time and chat and keeps durable bot and human chat callbacks', async () => {
  const f = fixture(['owner', 'friend']);
  f.lobby.createAt = 'original creation time';
  f.lobby.chat.addMessage('hello before launch', 'friend');
  const callback = jest.fn();
  f.lobby.onChatMessage = callback;
  const entries = [...f.lobby.chat.history];
  f.host.chatService = new ChatService(
    {
      append: async (_id: string, entry: any) => {
        entries.push(entry);
        return entry;
      },
      history: async () => [...entries],
      importHistory: async () => {},
    } as any,
    (id) => f.host.rooms[id],
    async () => undefined,
    f.host.io,
  );
  expect(await f.start()).toEqual({ ok: true });
  const room = f.host.rooms['lobby-id'] as BotRoom;
  expect(room).toBeInstanceOf(BotRoom);
  expect(room.createAt).toBe('original creation time');
  expect(room.chat.history[0].message).toBe('hello before launch');
  expect(room.humanIDs).toEqual(['owner', 'friend']);
  expect(room.players).toHaveLength(5);
  expect(room.ai).toMatchObject({
    botDifficulty: 'regular',
    codex: { model: 'gpt-6.1-terra', reasoning: 'medium' },
    status: 'running',
  });
  await room.persistChatMessage!('friend', 'hello after launch', 'human-chat');
  await room.persistChatMessage!(
    room.players.find((id) => !room.isHuman(id))!,
    'bot reply',
    'bot-chat',
  );
  expect(room.chat.history.map((entry) => entry.message)).toEqual([
    'hello before launch',
    'hello after launch',
    'bot reply',
  ]);
  expect(callback).toHaveBeenCalledTimes(2);
});

test.each([
  ['owner', ['owner'], 7, false],
  ['premium', ['premium'], 8, true],
  ['owner', ['owner', 'a', 'b', 'c', 'd'], 7, true],
  ['owner', ['owner', 'a', 'b', 'c', 'd', 'e'], 8, true],
  ['owner', ['owner'], 5, true],
  ['owner', ['owner'], 6, true],
])(
  'large-table policy after the host uses the weekly game for %s with %j humans at %i seats',
  async (user, humans, playerCount, allowed) => {
    const f = fixture(humans);
    f.weeklyReplays.set(user, ['already-used']);
    const response = await f.start(user, { playerCount, language: 'ru', humanPlayerIDs: humans });
    expect(response).toMatchObject(
      allowed ? { ok: true } : { error: 'weeklyLargeGameUsed', resetsAt: expect.any(Number) },
    );
    if (!allowed) {
      expect(f.host.rooms['lobby-id']).toBe(f.lobby);
      expect(f.held.size).toBe(0);
    }
  },
);

test.each([undefined, 'friend', 'missing', 'avalon-agent-1'])(
  'rejects unauthorized caller %s without changing the lobby',
  async (user) => {
    const f = fixture();
    const cb = jest.fn();
    await f
      .connect(user)
      .startLobbyAiRoom('lobby-id', { playerCount: 5, language: 'en', humanPlayerIDs: ['owner'] }, cb);
    expect(cb.mock.calls[0][0]).toHaveProperty('error');
    expect(f.host.rooms['lobby-id']).toBe(f.lobby);
    expect(f.held.size).toBe(0);
  },
);

test.each([
  {},
  { playerCount: 9, language: 'en', humanPlayerIDs: ['owner'] },
  { playerCount: 5, language: 'xx', humanPlayerIDs: ['owner'] },
  { playerCount: 5, language: 'en', humanPlayerIDs: ['owner', 'owner'] },
  { playerCount: 5, language: 'en', humanPlayerIDs: [] },
  { playerCount: 5, language: 'en', humanPlayerIDs: ['__proto__'] },
  { playerCount: 5, language: 'en', humanPlayerIDs: ['owner'], difficulty: 'regular' },
])('rejects malformed options through packet validation: %j', async (options) => {
  const f = fixture();
  expect(await f.start('owner', options)).toEqual({ error: 'invalidRequest' });
  expect(f.host.rooms['lobby-id']).toBe(f.lobby);
  expect(f.held.size).toBe(0);
});

test('requires callback and rejects reserved room IDs through the socket path', async () => {
  const f = fixture();
  const cb = jest.fn();
  await f
    .connect('owner')
    .startLobbyAiRoom('__proto__', { playerCount: 5, language: 'en', humanPlayerIDs: ['owner'] }, cb);
  expect(cb).toHaveBeenCalledWith({ error: 'invalidRequest' });
  await f.connect('owner').getLobbyAiAccess('lobby-id');
  await f.connect('owner').startLobbyAiRoom('lobby-id', { playerCount: 5, language: 'en', humanPlayerIDs: ['owner'] });
  expect(f.host.rooms['lobby-id']).toBe(f.lobby);
});

test('lobby preset requires Terra medium without falling back to another model', async () => {
  const f = fixture();
  jest.mocked(catalog.getCodexModels).mockResolvedValue([{ id: 'gpt-6.1-sol', label: 'Sol', efforts: ['medium'] }]);
  const cb = jest.fn();
  await f.connect('owner').getLobbyAiAccess('lobby-id', cb);
  expect(cb.mock.calls[0][0].available).toBe(false);
  expect(await f.start()).toHaveProperty('error');
  expect(f.host.rooms['lobby-id']).toBe(f.lobby);
  expect(f.held.size).toBe(0);
});

test.each(['roster', 'owner', 'identity', 'stage'])(
  'revalidates %s after asynchronous allocation and releases the reservation',
  async (change) => {
    const f = fixture();
    f.service.repository!.claim = async (id) => {
      f.held.add(id);
      if (change === 'roster') f.lobby.players.push('friend');
      if (change === 'owner') f.lobby.leaderID = 'friend';
      if (change === 'identity') f.host.rooms['lobby-id'] = new Room('lobby-id', 'owner', ['owner'], f.host.io);
      if (change === 'stage') f.lobby.data = { stage: 'locked' };
    };
    expect(await f.start()).toHaveProperty('error');
    expect(f.host.rooms['lobby-id']).not.toBeInstanceOf(BotRoom);
    expect(f.held.size).toBe(0);
  },
);

test('stale confirmed roster and full tables cannot start', async () => {
  const f = fixture(['owner', 'friend']);
  expect(await f.start('owner', { playerCount: 5, language: 'en', humanPlayerIDs: ['owner'] })).toHaveProperty('error');
  const full = fixture(['owner', 'a', 'b', 'c', 'd']);
  expect(await full.start()).toHaveProperty('error');
  expect(full.held.size).toBe(0);
});

test('duplicate successful starts are idempotent and concurrent preparation reserves only once', async () => {
  const f = fixture();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let claims = 0;
  f.service.repository!.claim = async (id) => {
    claims++;
    f.held.add(id);
    await gate;
  };
  const first = f.start();
  for (let i = 0; i < 30 && !claims; i++) await Promise.resolve();
  expect(claims).toBe(1);
  expect(await f.start()).toHaveProperty('error');
  release();
  expect(await first).toEqual({ ok: true });
  const adopted = f.host.rooms['lobby-id'];
  expect(await f.start()).toEqual({ ok: true });
  expect(f.host.rooms['lobby-id']).toBe(adopted);
  expect(claims).toBe(1);
});

test('mixed lobby spectators cannot read private roles after adoption', async () => {
  const f = fixture(['owner', 'friend']);
  expect(await f.start()).toEqual({ ok: true });
  for (const user of [undefined, 'spectator', 'owner', 'friend']) {
    const response = jest.fn();
    await f.connect(user).getAiSpectatorRoles('lobby-id', response);
    expect(response.mock.calls[0][0]).toEqual({ error: 'AI spectator roles unavailable' });
  }
});

test('uses the latest durable history when draining chat replaces the original lobby cache', async () => {
  const f = fixture();
  f.host.chatService = {
    history: async () => {
      const replacement = new (f.lobby.chat.constructor as any)();
      replacement.addMessage('completed during allocation', 'owner');
      f.lobby.chat = replacement;
      return replacement.history;
    },
    sendText: async () => {},
  } as any;
  expect(await f.start()).toEqual({ ok: true });
  expect(f.host.rooms['lobby-id'].chat.history[0].message).toBe('completed during allocation');
});

test('failed chat preparation keeps the original lobby and frees the lease for a retry', async () => {
  const f = fixture();
  const originalHistory = f.lobby.chat.history;
  f.host.chatService = {
    history: async () => {
      throw Error('storage down');
    },
  } as any;
  expect(await f.start()).toHaveProperty('error');
  expect(f.host.rooms['lobby-id']).toBe(f.lobby);
  expect(f.lobby.chat.history).toBe(originalHistory);
  expect(f.lobby.ai).toBeUndefined();
  expect(f.held.size).toBe(0);
  f.host.chatService = undefined as any;
  expect(await f.start()).toEqual({ ok: true });
});

test('guest Premium never unlocks a table for a non-Premium host', async () => {
  const f = fixture(['owner', 'premium']);
  f.weeklyReplays.set('owner', ['already-used']);
  expect(
    await f.start('owner', { playerCount: 7, language: 'en', humanPlayerIDs: ['owner', 'premium'] }),
  ).toHaveProperty('error');
  expect(f.held.size).toBe(0);
});

test('a room already started or archived cannot be adopted', async () => {
  const f = fixture(['owner', 'a', 'b', 'c', 'd']);
  const options = { playerCount: 6, language: 'en', humanPlayerIDs: [...f.lobby.players] };
  f.lobby.nextRoomID = 'next-game';
  expect(await f.start('owner', options)).toHaveProperty('error');
  delete f.lobby.nextRoomID;
  Room.prototype.startGame.call(f.lobby);
  expect(await f.start('owner', options)).toHaveProperty('error');
  expect(f.host.rooms['lobby-id']).toBe(f.lobby);
  expect(f.held.size).toBe(0);
});

test('a human already in an active bot game cannot launch another lobby', async () => {
  const f = fixture(['owner', 'friend']);
  const other = new BotRoom('other', 'friend', f.host.io, async () => ({ choice: 0, speech: '' }));
  other.joinAsHuman('friend');
  f.host.rooms.other = other;
  expect(await f.start()).toHaveProperty('error');
  expect(f.host.rooms['lobby-id']).toBe(f.lobby);
  expect(f.held.size).toBe(0);
});

test.each([
  ['owner', 'a', 'b', 'c', 'd'],
  ['first', 'owner', 'b', 'c', 'd'],
])(
  'non-Premium lobby rematch preserves a seven-seat two-bot roster with the owner in any position',
  async (...humans: string[]) => {
    const f = fixture(humans);
    f.lobby.leaderID = 'owner';
    expect(await f.start('owner', { playerCount: 7, language: 'ru', humanPlayerIDs: humans })).toEqual({ ok: true });
    const previous = f.host.rooms['lobby-id'] as BotRoom;
    if (previous.data.stage !== 'started') throw Error('Expected a started game');
    previous.data.manager.game.stage = 'end';
    previous.ai!.status = 'finished';
    await (f.service as any).releaseInstance(previous.roomID);
    const reply = jest.fn();
    await f.connect('owner').restartHumanAiRoom(previous.roomID, reply);
    const id = reply.mock.calls[0][0].roomID;
    expect(id).toBeDefined();
    const next = f.host.rooms[id] as BotRoom;
    expect(next.ai).toMatchObject({ status: 'running', playerCount: 7, language: 'ru' });
    expect(next.humanIDs).toEqual(['owner', ...humans.filter((id) => id !== 'owner')]);
    expect(previous.nextRoomID).toBe(id);
    expect(previous.data.manager.game.stage).toBe('end');
  },
);

test('a large prepared Arena game spends the same weekly allowance as lobby and rematch', async () => {
  const f = fixture();
  const socket = f.connect('owner');
  const call = async (event: string, ...args: any[]) => {
    const reply = jest.fn();
    await socket[event](...args, reply);
    return reply.mock.calls[0][0];
  };
  const options = { difficulty: 'regular', language: 'en', playerCount: 8 };
  const draft = await call('createHumanAiRoom', { ...options, beginner: false });
  expect(draft).toHaveProperty('roomID');
  expect(await call('getLobbyAiAccess', 'lobby-id')).toHaveProperty('weeklyLargeGame.remaining', 1);
  expect(await call('startHumanAiRoom', draft.roomID, options)).toEqual({ ok: true });
  expect(await call('startHumanAiRoom', draft.roomID, options)).toEqual({ ok: true });
  const room = f.host.rooms[draft.roomID];
  if (room.data.stage !== 'started') throw Error('Expected a started game');
  room.data.manager.game.stage = 'end';
  room.ai!.status = 'finished';
  await (f.service as any).releaseInstance(room.roomID);
  const published = jest.spyOn(f.host, 'updateRoomsList');
  expect(await call('restartHumanAiRoom', room.roomID)).toMatchObject({ error: 'weeklyLargeGameUsed' });
  expect(published).not.toHaveBeenCalled();
  expect(Object.keys(f.host.rooms).sort()).toEqual(['lobby-id', room.roomID].sort());
  expect(await f.start('owner', { playerCount: 7, language: 'en', humanPlayerIDs: ['owner'] })).toMatchObject({
    error: 'weeklyLargeGameUsed',
  });
  expect(await call('getAiRoomAccess')).toHaveProperty('weeklyLargeGame.remaining', 0);
});

test('a failed weekly write leaves the original lobby, its seats and the host allowance available', async () => {
  const f = fixture();
  jest.spyOn(f.service.repository!, 'commitWeeklyStart').mockRejectedValueOnce(Error('database unavailable'));
  const options = { playerCount: 7, language: 'en', humanPlayerIDs: ['owner'] };
  expect(await f.start('owner', options)).toHaveProperty('error');
  expect(f.host.rooms['lobby-id']).toBe(f.lobby);
  expect(f.lobby.committingBotStart).toBe(false);
  expect(f.held.size).toBe(0);
  expect(f.weeklyReplays.size).toBe(0);
  expect(await f.start('owner', options)).toEqual({ ok: true });
  expect(f.host.rooms['lobby-id'].data.stage).toBe('started');
  expect(f.weeklyReplays.size).toBe(1);
});

test('a rejected weekly write keeps a legacy Arena draft editable for a small game', async () => {
  const f = fixture();
  const socket = f.connect('owner');
  const created = jest.fn();
  await socket.createHumanAiRoom(created);
  const { roomID } = created.mock.calls[0][0];
  const draft = f.host.rooms[roomID];
  const first = jest.fn();
  jest.spyOn(f.service.repository!, 'commitWeeklyStart').mockRejectedValueOnce(Error('database unavailable'));
  await socket.startHumanAiRoom(roomID, { difficulty: 'regular', language: 'ru', playerCount: 8 }, first);
  expect(first.mock.calls[0][0]).toHaveProperty('error');
  expect(draft.ai).toMatchObject({ playerCount: 5, language: 'en', status: 'ready' });
  expect(draft.ai?.preparedDifficulty).toBeUndefined();
  const retry = jest.fn();
  await socket.startHumanAiRoom(roomID, { difficulty: 'regular', language: 'en', playerCount: 5 }, retry);
  expect(retry).toHaveBeenCalledWith({ ok: true });
  expect(f.weeklyReplays.size).toBe(0);
});

test('a new account sees its unlock time and cannot prepare or launch a large weekly game', async () => {
  const registered = Date.now() - 24 * 60 * 60 * 1000;
  const f = fixture(['owner'], new Date(registered).toISOString());
  const expected = { limit: 0, remaining: 0, unlocksAt: registered + 7 * 24 * 60 * 60 * 1000 };
  const socket = f.connect('owner');
  const access = jest.fn();
  await socket.getAiRoomAccess(access);
  expect(access).toHaveBeenCalledWith(expect.objectContaining({ weeklyLargeGame: expect.objectContaining(expected) }));
  const draft = jest.fn();
  await socket.createHumanAiRoom({ beginner: false, playerCount: 8 }, draft);
  expect(draft).toHaveBeenCalledWith(
    expect.objectContaining({ error: 'weeklyLargeGameUsed', weeklyLargeGame: expect.objectContaining(expected) }),
  );
  expect(await f.start('owner', { playerCount: 7, language: 'en', humanPlayerIDs: ['owner'] })).toMatchObject({
    error: 'weeklyLargeGameUsed',
    weeklyLargeGame: expected,
  });
  expect(f.held.size).toBe(0);
});

test('a veteran can use the second weekly game for a rematch', async () => {
  const f = fixture(['owner'], '2020-01-01T00:00:00Z');
  const socket = f.connect('owner');
  const access = jest.fn();
  await socket.getAiRoomAccess(access);
  expect(access.mock.calls.at(-1)?.[0]?.weeklyLargeGame).toMatchObject({ limit: 2, remaining: 2 });
  expect(await f.start('owner', { playerCount: 8, language: 'en', humanPlayerIDs: ['owner'] })).toEqual({ ok: true });
  const room = f.host.rooms['lobby-id'];
  if (room.data.stage !== 'started') throw Error('Expected a started game');
  room.data.manager.game.stage = 'end';
  room.ai!.status = 'finished';
  await (f.service as any).releaseInstance(room.roomID);
  await socket.getAiRoomAccess(access);
  expect(access.mock.calls.at(-1)?.[0]?.weeklyLargeGame).toMatchObject({ limit: 2, remaining: 1 });
  const rematch = jest.fn();
  await socket.restartHumanAiRoom(room.roomID, rematch);
  expect(rematch.mock.calls.at(-1)?.[0]).toHaveProperty('roomID');
  await socket.getAiRoomAccess(access);
  expect(access.mock.calls.at(-1)?.[0]?.weeklyLargeGame).toMatchObject({ limit: 2, remaining: 0 });
});
