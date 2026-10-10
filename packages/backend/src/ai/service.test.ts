/* eslint-disable @typescript-eslint/no-explicit-any */
import * as codexModels from './codex-models';
import * as codexLimits from './codex-limits';
import { AiService } from './service';
import { BotRoom } from './room';
import { handleSocketErrors } from '@/helpers/socket';
import type { Manager } from '@/main';
import type { Server, ServerSocket } from '@avalon/types';
import type { AiRepository } from './repository';

const initialEnvironment = { ...process.env };
beforeEach(() => {
  process.env.NODE_ENV = 'development';
  process.env.AI_CODEX_ENABLED = 'true';
  jest.spyOn(codexLimits, 'getCodexWeeklyLimit').mockResolvedValue(null);
  jest.spyOn(codexModels, 'getCodexModels').mockResolvedValue([]);
});
afterEach(() => {
  jest.restoreAllMocks();
  process.env = { ...initialEnvironment };
});

test('only database-admin authenticated account can create or control a room, duplicate create returns same room', async () => {
  const old = process.env.AI_ROOM_ADMIN_LOGINS;
  process.env.AI_ROOM_ADMIN_LOGINS = 'razdva';
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const sendText = jest.fn(async () => {});
  const host = {
    rooms: {},
    io,
    chatService: { sendText },
    updateRoomsList: () => {},
    dbManager: {
      getUserByID: async (id: string) => ({ login: 'razdva', isAdmin: id === 'owner' }),
    },
  } as unknown as Manager;
  const service = new AiService(host);
  service.repository = {
    claim: async () => {},
    release: async () => {},
    save: async () => {},
  } as unknown as AiRepository;
  // Socket transport is the boundary; callbacks run the actual authorization and room creation.
  function connect(id?: string) {
    const events: Record<string, (...args: any[]) => Promise<void>> = {};
    service.register(
      {
        on: (name: string, handler: (...args: any[]) => Promise<void>) => {
          events[name] = handler;
        },
      } as unknown as ServerSocket,
      id,
    );
    return events;
  }
  try {
    for (const id of [undefined, 'visitor']) {
      const response = jest.fn();
      await connect(id).createAiRoom('codex-chatgpt', response);
      expect(response.mock.calls[0][0]).toEqual({ error: 'AI room access denied' });
      expect(Object.keys(host.rooms)).toHaveLength(0);
    }
    const admin = connect('owner');
    const created = jest.fn();
    await admin.createAiRoom('codex-chatgpt', created);
    const id = created.mock.calls[0][0].roomID;
    expect(host.rooms[id]).toBeInstanceOf(BotRoom);
    await host.rooms[id].persistChatMessage?.('bot-author', 'Exact speech.', 'stable-publication-id');
    expect(sendText).toHaveBeenCalledWith(
      id,
      'bot-author',
      'Exact speech.',
      'stable-publication-id',
      expect.any(Function),
    );
    await admin.createAiRoom('codex-chatgpt', created);
    expect(created.mock.calls[1][0]).toEqual({ roomID: id });
    expect(Object.keys(host.rooms)).toHaveLength(1);
    const denied = jest.fn();
    await connect('visitor').controlAiRoom(id, 'start', denied);
    expect(denied.mock.calls[0][0]).toEqual({ error: 'AI room access denied' });
    expect(host.rooms[id].ai?.status).toBe('ready');
    await admin.controlAiRoom(id, 'stop', jest.fn());
    expect(host.rooms[id].ai?.status).toBe('stopped');
  } finally {
    if (old === undefined) delete process.env.AI_ROOM_ADMIN_LOGINS;
    else process.env.AI_ROOM_ADMIN_LOGINS = old;
  }
});

test('spectator reveal is AI-only, returns spectator details and never mutates player knowledge', async () => {
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const room = new BotRoom('reveal', 'owner', io, async () => {
    throw Error('pause fixture');
  });
  await room.run();
  const host = { rooms: { reveal: room, normal: { ai: undefined } }, dbManager: {} } as unknown as Manager;
  const service = new AiService(host);
  const request = async (id: unknown, userID?: string) => {
    const events: Record<string, (...args: any[]) => Promise<void>> = {};
    service.register(
      {
        on: (name: string, fn: any) => {
          events[name] = fn;
        },
      } as unknown as ServerSocket,
      userID,
    );
    expect(events.getAiSpectatorRoles).toBeDefined();
    const cb = jest.fn();
    await events.getAiSpectatorRoles(id, cb);
    return cb.mock.calls[0][0];
  };
  const before = JSON.stringify(room.calculateRoomState());
  const response = await request('reveal');
  expect(Object.keys(response)).toEqual(['roles', 'decisions']);
  expect(response.decisions).toEqual([]);
  expect(Object.keys(response.roles)).toHaveLength(7);
  expect(Object.values(response.roles)).toContain('merlin');
  expect(JSON.stringify(room.calculateRoomState())).toBe(before);
  for (const id of ['normal', 'missing', '__proto__', null, []]) expect(await request(id)).toHaveProperty('error');
  expect(await request('reveal', room.players[0])).toHaveProperty('error');
});

test.each([
  ['en', undefined],
  ['ru', undefined],
  ['zh-tw', undefined],
  ['en', 5],
  ['ru', 5],
  ['zh-tw', 5],
  ['en', 6],
  ['ru', 6],
  ['zh-tw', 6],
  ['en', 7],
  ['ru', 7],
  ['zh-tw', 7],
  ['en', 8],
  ['ru', 8],
  ['zh-tw', 8],
])(
  'creation saves language %s and AI player count %s through the actual socket boundary',
  async (language, playerCount) => {
    const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
    const host = {
      rooms: {},
      io,
      updateRoomsList: jest.fn(),
      dbManager: { getUserByID: async () => ({ isAdmin: true }) },
    } as unknown as Manager;
    const service = new AiService(host);
    service.repository = { claim: async () => {} } as unknown as AiRepository;
    const handlers: Record<string, (...args: any[]) => Promise<void>> = {};
    const socket = {
      on: (name: string, handler: any) => {
        handlers[name] = handler;
        return socket;
      },
    } as unknown as ServerSocket;
    handleSocketErrors(socket);
    service.register(socket, 'owner');
    const created = jest.fn();
    await handlers.createAiRoom(
      { model: 'codex-chatgpt', language, ...(playerCount === undefined ? {} : { playerCount }) },
      created,
    );
    expect(created.mock.calls[0][0]).toHaveProperty('roomID');
    const room = host.rooms[created.mock.calls[0][0].roomID];
    expect(room.calculateRoomState().ai).toMatchObject({
      model: 'codex-chatgpt',
      language,
      playerCount: playerCount ?? 7,
    });
    expect(room.players).toHaveLength(playerCount ?? 7);
    expect(room.maxCapacity).toBe(playerCount ?? 7);
  },
);

test('invalid AI player counts are rejected before reserving a room', async () => {
  const host = { rooms: {}, dbManager: { getUserByID: async () => ({ isAdmin: true }) } } as unknown as Manager;
  const service = new AiService(host);
  const claim = jest.fn(async () => {});
  service.repository = { claim } as unknown as AiRepository;
  const handlers: Record<string, (...args: any[]) => Promise<void>> = {};
  service.register(
    {
      on: (name: string, handler: any) => {
        handlers[name] = handler;
      },
    } as unknown as ServerSocket,
    'owner',
  );
  for (const playerCount of [0, 4, 9, 10, 5.5, '5', null, undefined, {}, [], NaN, Infinity]) {
    const response = jest.fn();
    await handlers.createAiRoom({ model: 'codex-chatgpt', language: 'ru', playerCount }, response);
    expect(response).toHaveBeenCalledWith({ error: 'Invalid AI player count' });
  }
  expect(claim).not.toHaveBeenCalled();
  expect(Object.keys(host.rooms)).toHaveLength(0);
});

test('creation rejects unsupported or malformed language options before claiming a lease', async () => {
  const host = {
    rooms: {},
    dbManager: { getUserByID: async () => ({ isAdmin: true }) },
  } as unknown as Manager;
  const service = new AiService(host);
  const claim = jest.fn(async () => {});
  service.repository = { claim } as unknown as AiRepository;
  const handlers: Record<string, (...args: any[]) => Promise<void>> = {};
  service.register(
    {
      on: (name: string, handler: any) => {
        handlers[name] = handler;
      },
    } as unknown as ServerSocket,
    'owner',
  );
  for (const language of ['EN', 'ru-RU', 'zh', 'zh-cn', '', undefined, null, {}, ['en']]) {
    const response = jest.fn();
    await handlers.createAiRoom({ model: 'codex-chatgpt', language }, response);
    expect(response.mock.calls[0][0]).toEqual({ error: 'Invalid AI language' });
  }
  for (const value of [null, [], {}, { language: 'ru' }, { model: 7, language: 'ru' }]) {
    const response = jest.fn();
    await handlers.createAiRoom(value, response);
    expect(response.mock.calls[0][0]).toHaveProperty('error');
  }
  expect(claim).not.toHaveBeenCalled();
  expect(Object.keys(host.rooms)).toHaveLength(0);
});

test('public AI list returns latest 20 unique rooms with live state and no private game data', async () => {
  const archived = Array.from({ length: 25 }, (_, index) => ({
    roomID: `ai-${index}`,
    ai: { status: 'finished', model: 'test-model', costRub: 123 },
    stage: 'started',
    leaderID: 'host',
    players: [{ id: 'bot' }],
    options: {},
    createAt: new Date(2026, 0, index + 1).toISOString(),
    game: { result: { winner: 'good' }, secret: 'hidden' },
    chat: ['private'],
  }));
  const live = { ...archived[24], ai: { status: 'running' }, game: {} };
  const host = {
    dbManager: {},
    rooms: {
      live: { ai: live.ai, calculateRoomState: () => live },
      human: {
        calculateRoomState: () => {
          throw Error('Human room must not be read');
        },
      },
    },
  } as unknown as Manager;
  const service = new AiService(host);
  const recent = jest.fn(async () =>
    archived.map((room) => ({
      uuid: room.roomID,
      ai: true,
      aiStatus: room.ai.status,
      aiModel: room.ai.model,
      hostID: room.leaderID,
      state: room.stage,
      options: room.options,
      players: room.players.length,
      createAt: room.createAt,
      result: room.game.result,
    })),
  );
  service.repository = { recentSummaries: recent } as unknown as AiRepository;
  const handlers: Record<string, (...args: any[]) => Promise<void>> = {};
  service.register({
    on: (name: string, handler: any) => {
      handlers[name] = handler;
    },
  } as unknown as ServerSocket);
  const response = jest.fn();
  await handlers.getAiRoomsList(response);
  expect(recent).toHaveBeenCalledWith();
  const { rooms } = response.mock.calls[0][0];
  expect(rooms).toHaveLength(20);
  expect(rooms.map((room: any) => room.uuid)).toEqual(
    archived
      .slice(5)
      .reverse()
      .map((room) => room.roomID),
  );
  expect(rooms[0].aiStatus).toBe('running');
  expect(rooms[0].aiLanguage).toBe('en');
  expect(rooms.every((room: any) => room.ai)).toBe(true);
  expect(rooms[0]).not.toHaveProperty('game');
  expect(rooms[0]).not.toHaveProperty('chat');
  expect(rooms[0]).not.toHaveProperty('ai.costRub');
  recent.mockRejectedValueOnce(new Error('database private details') as never);
  await handlers.getAiRoomsList(response);
  expect(response).toHaveBeenLastCalledWith({ error: 'Could not load AI rooms' });
});

test('technical resume requires a current admin and rejects non-recoverable or stopped rooms', async () => {
  const { AiTechnicalPause, AiPause } = await import('./client');
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  let admin = true;
  const room = new BotRoom('technical', 'owner', io, async () => {
    throw new AiTechnicalPause('Output limit');
  });
  await room.run();
  const host = {
    rooms: { technical: room },
    io,
    updateRoomsList: jest.fn(),
    dbManager: { getUserByID: async () => ({ isAdmin: admin }) },
  } as unknown as Manager;
  const service = new AiService(host);
  const claim = jest.fn(async () => {});
  service.repository = {
    claim,
    save: async () => {},
    release: async () => {},
  } as unknown as AiRepository;
  const handlers: Record<string, (...args: any[]) => Promise<void>> = {};
  service.register(
    {
      on: (name: string, handler: any) => {
        handlers[name] = handler;
      },
    } as unknown as ServerSocket,
    'owner',
  );
  const control = async () => {
    const cb = jest.fn();
    await handlers.controlAiRoom('technical', 'resumeTechnical', cb);
    return cb.mock.calls[0][0];
  };
  admin = false;
  expect(await control()).toHaveProperty('error');
  expect(claim).not.toHaveBeenCalled();
  admin = true;
  const responses = await Promise.all([control(), control()]);
  expect(responses.filter((r) => r.ok)).toHaveLength(1);
  await new Promise((resolve) => setImmediate(resolve));
  room.stop();
  expect(await control()).toHaveProperty('error');
  const blockedRoom = new BotRoom('technical', 'owner', io, async () => {
    throw new AiPause('Non-recoverable pause');
  });
  await blockedRoom.run();
  host.rooms.technical = blockedRoom;
  expect(await control()).toHaveProperty('error');
  expect(claim).toHaveBeenCalledTimes(1);
});

test.each(['development', 'production'])(
  '%s advertises and creates opt-in Codex with the Codex transport',
  async (environment) => {
    const previous = { ...process.env };
    const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
    const host = {
      rooms: {},
      io,
      updateRoomsList: jest.fn(),
      dbManager: { dbInstance: { connection: { db: {} } }, getUserByID: async () => ({ isAdmin: true }) },
    } as unknown as Manager;
    try {
      process.env.NODE_ENV = environment;
      process.env.AI_ROOMS_ENABLED = 'true';
      process.env.AI_CODEX_ENABLED = 'true';
      const service = new AiService(host);
      expect(service.repository).toBeDefined();
      const claim = jest.fn();
      service.repository = { claim, save: jest.fn() } as unknown as AiRepository;
      const handlers: Record<string, (...args: any[]) => Promise<void>> = {};
      service.register(
        {
          on: (name: string, h: any) => {
            handlers[name] = h;
          },
        } as unknown as ServerSocket,
        'owner',
      );
      const access = jest.fn();
      await handlers.getAiRoomAccess(access);
      expect(access.mock.calls[0][0].models).toContainEqual({ id: 'codex-chatgpt', label: 'Codex · ChatGPT' });
      const created = jest.fn();
      await handlers.createAiRoom('codex-chatgpt', created);
      expect(created.mock.calls[0][0]).toHaveProperty('roomID');
      expect(host.rooms[created.mock.calls[0][0].roomID].ai?.model).toBe('codex-chatgpt');
      expect(claim).toHaveBeenCalledTimes(1);
      process.env.AI_CODEX_ENABLED = 'false';
      host.rooms = {};
      const denied = jest.fn();
      await handlers.createAiRoom('codex-chatgpt', denied);
      expect(denied.mock.calls[0][0]).toHaveProperty('error');
      expect(claim).toHaveBeenCalledTimes(1);
      await handlers.getAiRoomAccess(access);
      expect(access.mock.calls.at(-1)[0]).toEqual({ canManage: false });
    } finally {
      process.env = previous;
    }
  },
);

test('Codex settings require admin access and stay frozen after launch', async () => {
  const catalog = jest
    .spyOn(codexModels, 'getCodexModels')
    .mockResolvedValue([{ id: 'gpt-6-luna', label: 'Luna', efforts: ['low', 'high'] }]);
  const old = { ...process.env };
  process.env.NODE_ENV = 'development';
  process.env.AI_CODEX_ENABLED = 'true';
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const room = new BotRoom(
    'settings-room',
    'admin',
    io,
    async () => ({ choice: 0, speech: '' }),
    async () => {},
    0,
  );
  room.ai!.model = 'codex-chatgpt';
  const host = {
    rooms: { 'settings-room': room },
    io,
    updateRoomsList: jest.fn(),
    dbManager: { getUserByID: async (id: string) => ({ isAdmin: id === 'admin' }) },
  } as unknown as Manager;
  const service = new AiService(host);
  const saved: any[] = [];
  service.repository = {
    save: async (state: any) => {
      saved.push(state);
    },
  } as unknown as AiRepository;
  const settings = { model: 'gpt-6-luna', reasoning: 'high' };
  function connect(id: string) {
    const events: Record<string, any> = {};
    service.register(
      {
        on: (name: string, fn: any) => {
          events[name] = fn;
        },
      } as unknown as ServerSocket,
      id,
    );
    return events;
  }
  try {
    const denied = jest.fn();
    await connect('visitor').configureAiCodex('settings-room', settings, denied);
    expect(denied.mock.calls[0][0]).toEqual({ error: 'AI room access denied' });
    const admin = connect('admin');
    const unconfigured = jest.fn();
    await admin.controlAiRoom('settings-room', 'start', unconfigured);
    expect(unconfigured.mock.calls[0][0]).toEqual({ error: 'Choose a Codex model and reasoning level before launch' });
    const response = jest.fn();
    await admin.configureAiCodex('settings-room', settings, response);
    expect(response.mock.calls[0][0]).toEqual({ ok: true });
    expect(saved[0].ai.codex).toEqual(settings);
    expect(host.updateRoomsList).toHaveBeenCalledWith(room);
    room.ai!.status = 'running';
    await admin.configureAiCodex('settings-room', { ...settings, reasoning: 'low' }, response);
    expect(response.mock.calls[1][0]).toHaveProperty('error');
    expect((room.ai as any).codex).toEqual(settings);
  } finally {
    catalog.mockRestore();
    process.env = old;
  }
});

test('administrator access stays available when the Codex catalog fails and public modes fail closed', async () => {
  const old = { ...process.env };
  process.env.NODE_ENV = 'development';
  process.env.AI_CODEX_ENABLED = 'true';
  const catalog = jest.spyOn(codexModels, 'getCodexModels').mockRejectedValue(Error('Catalog unavailable'));
  const service = new AiService({
    rooms: {},
    dbManager: { getUserByID: async () => ({ isAdmin: true }) },
  } as unknown as Manager);
  service.repository = {} as AiRepository;
  const events: Record<string, any> = {};
  service.register(
    {
      on: (name: string, fn: any) => {
        events[name] = fn;
      },
    } as unknown as ServerSocket,
    'admin',
  );
  try {
    const response = jest.fn();
    await events.getAiRoomAccess(response);
    expect(response.mock.calls[0][0]).toMatchObject({
      canManage: true,
      canPlay: true,
      botModes: { smart: false, regular: false },
    });
  } finally {
    catalog.mockRestore();
    process.env = old;
  }
});

test('archived AI statistics remain readable when game generation is disabled', async () => {
  const previous = process.env.AI_ROOMS_ENABLED;
  process.env.AI_ROOMS_ENABLED = 'false';
  try {
    const service = new AiService({
      dbManager: { dbInstance: { connection: { db: {} } } },
      rooms: {},
    } as unknown as Manager);
    expect(service.archiveRepository).toBeDefined();
    expect(service.repository).toBeUndefined();
    expect(await service.canManage('owner')).toBe(false);
  } finally {
    if (previous === undefined) delete process.env.AI_ROOMS_ENABLED;
    else process.env.AI_ROOMS_ENABLED = previous;
  }
});

test('weekly Codex quota is admin-only in production, unavailable data stays null and disabled Codex cannot query it', async () => {
  const previous = { ...process.env };
  const quota = jest.spyOn(codexLimits, 'getCodexWeeklyLimit').mockResolvedValue(null);
  const host = {
    rooms: {},
    dbManager: { getUserByID: async (id: string) => ({ isAdmin: id === 'owner' }) },
  } as unknown as Manager;
  try {
    process.env.NODE_ENV = 'development';
    process.env.AI_CODEX_ENABLED = 'true';
    const service = new AiService(host);
    service.repository = {} as AiRepository;
    const connect = (id?: string) => {
      const handlers: Record<string, (...args: any[]) => Promise<void>> = {};
      service.register(
        {
          on: (name: string, handler: any) => {
            handlers[name] = handler;
          },
        } as unknown as ServerSocket,
        id,
      );
      return handlers;
    };
    for (const id of [undefined, 'visitor']) {
      const callback = jest.fn();
      await connect(id).getAiCodexWeeklyLimit(callback);
      expect(callback.mock.calls[0][0]).toHaveProperty('error');
    }
    expect(quota).not.toHaveBeenCalled();
    const callback = jest.fn();
    await connect('owner').getAiCodexWeeklyLimit(callback);
    expect(callback).toHaveBeenCalledWith({ weekly: null });
    expect(quota).toHaveBeenCalledTimes(1);
    process.env.NODE_ENV = 'production';
    await connect('owner').getAiCodexWeeklyLimit(callback);
    expect(callback.mock.calls.at(-1)[0]).toEqual({ weekly: null });
    expect(quota).toHaveBeenCalledTimes(2);
    process.env.AI_CODEX_ENABLED = 'false';
    await connect('owner').getAiCodexWeeklyLimit(callback);
    expect(callback.mock.calls.at(-1)[0]).toHaveProperty('error');
    expect(quota).toHaveBeenCalledTimes(2);
  } finally {
    process.env = previous;
    quota.mockRestore();
  }
});

test('only the database-admin owner can take the single human seat; mixed games never reveal roles to spectators', async () => {
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const room = new BotRoom('mixed-room', 'owner', io, async () => ({ choice: 0, speech: '' }));
  const host = {
    rooms: { 'mixed-room': room },
    io,
    updateRoomsList() {},
    dbManager: { getUserByID: async (id: string) => ({ isAdmin: ['owner', 'other-admin'].includes(id) }) },
  } as unknown as Manager;
  const service = new AiService(host);
  service.repository = { save: async () => {} } as unknown as AiRepository;
  function connect(id?: string) {
    const events: Record<string, (...args: any[]) => any> = {};
    service.register(
      {
        on: (name: string, handler: (...args: any[]) => any) => {
          events[name] = handler;
        },
      } as unknown as ServerSocket,
      id,
    );
    return events;
  }
  for (const id of [undefined, 'visitor', 'other-admin']) {
    const cb = jest.fn();
    await connect(id).joinAiRoom('mixed-room', cb);
    expect(cb.mock.calls[0][0]).toHaveProperty('error');
    expect(room.players).not.toContain('owner');
  }
  const cb = jest.fn();
  await connect('owner').joinAiRoom('mixed-room', cb);
  expect(cb.mock.calls[0][0]).toEqual({ ok: true });
  expect(room.players).toContain('owner');
  // Start the underlying real engine without running bots, to exercise the reveal boundary.
  const { Room } = await import('@/room');
  Room.prototype.startGame.call(room);
  room.ai!.status = 'running';
  const reveal = jest.fn();
  connect().getAiSpectatorRoles('mixed-room', reveal);
  expect(reveal.mock.calls[0][0]).toHaveProperty('error');
  await connect('owner').joinAiRoom('mixed-room', cb);
  expect(cb.mock.calls[1][0]).toHaveProperty('error');
  room.stop();
});

test('passing the human discussion waits for preceding chat writes and rejects spectators', async () => {
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const room = new BotRoom('discussion-room', 'owner', io, async () => ({ choice: 0, speech: '' }));
  room.joinAsHuman('owner');
  let release!: () => void;
  const history = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  const host = {
    rooms: { 'discussion-room': room },
    io,
    dbManager: {},
    chatService: { history },
  } as unknown as Manager;
  const service = new AiService(host);
  const finish = jest.spyOn(room, 'finishDiscussion').mockImplementation(() => {});
  function connect(id: string) {
    const events: Record<string, (...args: any[]) => any> = {};
    service.register(
      {
        on: (name: string, handler: (...args: any[]) => any) => {
          events[name] = handler;
        },
      } as unknown as ServerSocket,
      id,
    );
    return events;
  }
  const denied = jest.fn();
  await connect('spectator').finishAiDiscussion('discussion-room', denied);
  expect(denied.mock.calls[0][0]).toHaveProperty('error');
  expect(history).not.toHaveBeenCalled();
  const ack = jest.fn();
  const passing = connect('owner').finishAiDiscussion('discussion-room', ack);
  expect(history).toHaveBeenCalledWith('discussion-room', room.chat.history);
  expect(finish).not.toHaveBeenCalled();
  release();
  await passing;
  expect(finish).toHaveBeenCalledWith('owner');
  expect(ack).toHaveBeenCalledWith({ ok: true });
});
