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
      await connect(id).createAiRoom(response);
      expect(response.mock.calls[0][0]).toEqual({ error: 'AI room access denied' });
      expect(Object.keys(host.rooms)).toHaveLength(0);
    }
    const admin = connect('owner');
    const created = jest.fn();
    await admin.createAiRoom(created);
    const id = created.mock.calls[0][0].roomID;
    expect(host.rooms[id]).toBeInstanceOf(BotRoom);
    await admin.createAiRoom(created);
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
  expect(success).toHaveBeenCalledWith({ costs: { archive: 18.4 } });
  for (isAdmin of [false, undefined, 'true', 1]) {
    const access = jest.fn();
    await handlers.getAiRoomAccess(access);
    expect(access).toHaveBeenCalledWith({ canManage: false });
    for (const [event, args] of [
      ['createAiRoom', []],
      ['getAiBudget', []],
      ['controlAiRoom', ['archive', 'start']],
      ['controlAiRoom', ['archive', 'stop']],
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
