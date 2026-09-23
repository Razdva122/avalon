/* eslint-disable @typescript-eslint/no-explicit-any */
import { AiService } from './service';
import { BotRoom } from './room';
import type { Manager } from '@/main';
import type { Server, ServerSocket } from '@avalon/types';
import type { AiRepository } from './repository';

test('only database-admin authenticated account can create or control a room, duplicate create returns same room', async () => {
  const old = process.env.AI_ROOM_ADMIN_LOGINS;
  process.env.AI_ROOM_ADMIN_LOGINS = 'razdva';
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const host = {
    rooms: {},
    io,
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
      await connect(id).createAiRoom('qwen3.6-35b-a3b', response);
      expect(response.mock.calls[0][0]).toEqual({ error: 'AI room access denied' });
      expect(Object.keys(host.rooms)).toHaveLength(0);
    }
    const admin = connect('owner');
    const created = jest.fn();
    await admin.createAiRoom('qwen3.6-35b-a3b', created);
    const id = created.mock.calls[0][0].roomID;
    expect(host.rooms[id]).toBeInstanceOf(BotRoom);
    await admin.createAiRoom('qwen3.6-35b-a3b', created);
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

test('every admin request reads current database permissions, including archived costs', async () => {
  let isAdmin: unknown = true;
  const getUserByID = jest.fn(async () => ({ login: 'razdva', isAdmin }));
  const host = { rooms: {}, dbManager: { getUserByID } } as unknown as Manager;
  const service = new AiService(host);
  const load = jest.fn(async () => ({ ai: { costRub: 18.4 } }));
  service.repository = {
    load,
    roomLimit: async () => 150,
    budget: async () => ({ limitRub: 3000, usedRub: 40, remainingRub: 2960, matchLimitRub: 150 }),
  } as unknown as AiRepository;
  const handlers: Record<string, (...args: any[]) => Promise<void>> = {};
  service.register(
    {
      on: (name: string, fn: any) => {
        handlers[name] = fn;
      },
    } as unknown as ServerSocket,
    'admin',
  );
  const summary = jest.fn();
  await handlers.getAiBudget(summary);
  expect(summary).toHaveBeenCalledWith({
    budget: { limitRub: 3000, usedRub: 40, remainingRub: 2960, matchLimitRub: 150 },
  });
  const success = jest.fn();
  await handlers.getAiRoomCosts(['archive'], success);
  expect(success).toHaveBeenCalledWith({ costs: { archive: 18.4 }, limits: { archive: 150 } });
  for (isAdmin of [false, undefined, 'true', 1]) {
    const access = jest.fn();
    await handlers.getAiRoomAccess(access);
    expect(access).toHaveBeenCalledWith({ canManage: false });
    for (const [event, args] of [
      ['createAiRoom', ['deepseek-v4-flash']],
      ['getAiBudget', []],
      ['controlAiRoom', ['archive', 'start']],
      ['controlAiRoom', ['archive', 'stop']],
      ['controlAiRoom', ['archive', 'resumeBudget']],
      ['getAiRoomCosts', [['archive']]],
    ] as const) {
      const cb = jest.fn();
      await handlers[event](...args, cb);
      expect(cb).toHaveBeenCalledWith({ error: 'AI room access denied' });
    }
  }
  expect(load).toHaveBeenCalledTimes(1);
  getUserByID.mockRejectedValueOnce(Error('DB unavailable'));
  expect(await service.canManage('admin')).toBe(false);
});

test('spectator reveal is AI-only, returns only roles and never mutates player knowledge', async () => {
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
  expect(Object.keys(response)).toEqual(['roles']);
  expect(Object.keys(response.roles)).toHaveLength(7);
  expect(Object.values(response.roles)).toContain('merlin');
  expect(JSON.stringify(room.calculateRoomState())).toBe(before);
  for (const id of ['normal', 'missing', '__proto__', null, []]) expect(await request(id)).toHaveProperty('error');
  expect(await request('reveal', room.players[0])).toHaveProperty('error');
});

test('admin budget resume doubles once, waits for old run cleanup and rejects other pause reasons', async () => {
  const { AiMatchBudgetPause, AiPause } = await import('./client');
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const room = new BotRoom('resume', 'owner', io, async () => {
    throw new AiMatchBudgetPause('Match budget', 2000);
  });
  const host = {
    rooms: { resume: room },
    io,
    updateRoomsList: jest.fn(),
    dbManager: { getUserByID: async () => ({ isAdmin: true }) },
  } as unknown as Manager;
  const service = new AiService(host);
  let release: () => void = () => {};
  const doubleMatchLimit = jest.fn(async () => 300);
  service.repository = {
    claim: async () => {},
    save: async () => {},
    doubleMatchLimit,
    release: () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
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
  const control = async (action: string) => {
    const cb = jest.fn();
    await handlers.controlAiRoom('resume', action, cb);
    return cb.mock.calls[0][0];
  };
  expect(await control('resumeBudget')).toHaveProperty('error');
  expect(await control('start')).toEqual({ ok: true });
  await new Promise((resolve) => setImmediate(resolve));
  expect(room.ai?.canResumeBudget).toBe(true);
  expect(await control('resumeBudget')).toHaveProperty('error');
  expect(doubleMatchLimit).not.toHaveBeenCalled();
  release();
  await new Promise((resolve) => setImmediate(resolve));
  const responses = await Promise.all([control('resumeBudget'), control('resumeBudget')]);
  expect(responses.filter((r) => r.ok)).toHaveLength(1);
  expect(doubleMatchLimit).toHaveBeenCalledTimes(1);
  expect(doubleMatchLimit).toHaveBeenCalledWith('resume', 2000);
  await new Promise((resolve) => setImmediate(resolve));
  release();
  await new Promise((resolve) => setImmediate(resolve));
  const other = new BotRoom('resume', 'owner', io, async () => {
    throw new AiPause('Context limit');
  });
  await other.run();
  host.rooms.resume = other;
  expect(await control('resumeBudget')).toHaveProperty('error');
  expect(doubleMatchLimit).toHaveBeenCalledTimes(1);
});

test('creation validates selected model before claiming a lease and pins DeepSeek independently of the default', async () => {
  const previous = process.env.YANDEX_MODEL;
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const host = {
    rooms: {},
    io,
    updateRoomsList: jest.fn(),
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
  try {
    process.env.YANDEX_MODEL = 'unknown-model';
    const access = jest.fn();
    await handlers.getAiRoomAccess(access);
    expect(access).toHaveBeenCalledWith({
      canManage: true,
      roomID: undefined,
      defaultModel: 'qwen3.6-35b-a3b',
      models: [
        { id: 'qwen3.6-35b-a3b', label: 'Qwen3.6 35B' },
        { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
      ],
    });
    for (const value of ['unknown-model', '__proto__', '', null, {}, ['deepseek-v4-flash']]) {
      const denied = jest.fn();
      await handlers.createAiRoom(value, denied);
      expect(denied.mock.calls[0][0]).toHaveProperty('error');
    }
    expect(claim).not.toHaveBeenCalled();
    expect(Object.keys(host.rooms)).toHaveLength(0);
    process.env.YANDEX_MODEL = 'qwen3.6-35b-a3b';
    const created = jest.fn();
    await handlers.createAiRoom('deepseek-v4-flash', created);
    const room = host.rooms[created.mock.calls[0][0].roomID];
    expect(room.ai?.model).toBe('deepseek-v4-flash');
    const reopened = jest.fn();
    await handlers.createAiRoom('qwen3.6-35b-a3b', reopened);
    expect(reopened).toHaveBeenCalledWith({ roomID: room.roomID });
    process.env.YANDEX_MODEL = 'qwen3.6-35b-a3b';
    expect(room.ai?.model).toBe('deepseek-v4-flash');
  } finally {
    if (previous === undefined) delete process.env.YANDEX_MODEL;
    else process.env.YANDEX_MODEL = previous;
  }
});
