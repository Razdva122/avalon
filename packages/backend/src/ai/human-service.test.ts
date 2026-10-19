/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Manager } from '@/main';
import { Room } from '@/room';
import type { Server, ServerSocket } from '@avalon/types';
import { AiService } from './service';
import { BotRoom } from './room';
import type { AiRepository } from './repository';
import * as limits from './codex-limits';
import * as catalog from './codex-models';
import * as support from '@/support/repository';
import { errorHandler } from '@/helpers/socket';

const initialEnvironment = { ...process.env };
const models = [
  { id: 'gpt-6.1-sol', label: 'Sol', efforts: ['medium'] },
  { id: 'gpt-6-luna', label: 'Luna', efforts: ['low', 'medium'] },
];
let quota: jest.SpyInstance;
let modelCatalog: jest.SpyInstance;
let run: jest.SpyInstance;
beforeEach(() => {
  process.env.NODE_ENV = 'development';
  process.env.AI_CODEX_ENABLED = 'true';
  quota = jest.spyOn(limits, 'getCodexWeeklyLimit').mockResolvedValue({
    remainingPercent: 10,
    resetsAt: null,
    checkedAt: Date.now(),
    shortTerm: { remainingPercent: 90, resetsAt: null },
  });
  jest.spyOn(support, 'supportTotalCents').mockResolvedValue(0);
  modelCatalog = jest.spyOn(catalog, 'getCodexModels').mockResolvedValue(models);
  // Exercise the real start engine without issuing model turns.
  run = jest.spyOn(BotRoom.prototype, 'run').mockImplementation(async function (this: BotRoom) {
    this.ai!.status = 'running';
    if (this.data.stage !== 'started') Room.prototype.startGame.call(this);
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  process.env = { ...initialEnvironment };
});

function fixture(adminID = 'admin', validatePackets = false) {
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const claim = jest.fn<Promise<void>, [string]>(async () => {});
  const release = jest.fn<Promise<void>, [string]>(async () => {});
  const save = jest.fn(async () => {});
  const host = {
    rooms: {},
    io,
    updateRoomsList() {},
    dbManager: {
      getUserFeatures: async (id: string) => ({
        showPremiumBadge: false,
        ...(id === 'premium' ? { premiumGrantedAt: new Date() } : {}),
      }),
      getUserByID: async (id: string) => {
        if (id === 'missing') throw Error('No user');
        return { id, name: id === 'owner' ? 'Alice' : id, isAdmin: id === adminID };
      },
    },
  } as unknown as Manager;
  const service = new AiService(host);
  service.repository = {
    claim,
    release,
    save,
    renewLease: async () => {},
    busyInstances: async () => [],
  } as unknown as AiRepository;
  function connect(id?: string) {
    const handlers: Record<string, (...args: any[]) => Promise<void>> = {};
    service.register(
      {
        on: (event: string, handler: any) =>
          (handlers[event] = validatePackets
            ? errorHandler(handler, { emit: jest.fn() } as unknown as ServerSocket, event)
            : handler),
      } as unknown as ServerSocket,
      id,
    );
    return handlers;
  }
  async function draft(owner = 'owner') {
    const response = jest.fn();
    await connect(owner).createHumanAiRoom(response);
    expect(response).toHaveBeenCalled();
    expect(response.mock.calls[0][0]).toHaveProperty('roomID');
    return host.rooms[response.mock.calls[0][0].roomID] as BotRoom;
  }
  return { host, service, connect, claim, release, save, draft };
}

test.each([false, true])(
  'unified setup reaches room creation through socket validation, withFriend=%s',
  async (withFriend) => {
    const { connect, host } = fixture('admin', true);
    const response = jest.fn();
    await connect('premium').createHumanAiRoom(
      {
        beginner: false,
        withFriend,
        difficulty: 'regular',
        language: 'en',
        playerCount: 7,
      },
      response,
    );
    const id = response.mock.calls[0][0].roomID;
    expect(id).toBeDefined();
    expect(host.rooms[id].ai).toMatchObject({ preparedDifficulty: 'regular', language: 'en', playerCount: 7 });
    expect(run).not.toHaveBeenCalled();
  },
);

test('create prepares a named four-bot table, reserves its slot, and makes no model turn', async () => {
  const { draft, claim } = fixture();
  const room = await draft();
  expect(room.players).toHaveLength(5);
  expect(new Set(room.players).size).toBe(5);
  expect(room.ai).toMatchObject({
    publicBotGame: true,
    humanPlayerID: 'owner',
    title: 'Alice vs 4 Bots',
    status: 'ready',
  });
  expect(room.ai).not.toHaveProperty('botDifficulty');
  expect(room.ai).not.toHaveProperty('codex');
  expect(room.ai!.launchExpiresAt).toBeGreaterThan(Date.now());
  expect(room.data.stage).toBe('locked');
  expect(run).not.toHaveBeenCalled();
  expect(claim).toHaveBeenCalledWith(room.roomID);
});

test('only the ready-room owner can stop preparation, cancel expiry, and release the slot for another player', async () => {
  jest.useFakeTimers();
  const { draft, connect, claim, release, host } = fixture();
  let lease: string | undefined;
  claim.mockImplementation(async (id: string) => {
    if (lease && lease !== id) throw Error('Slot busy');
    lease = id;
  });
  release.mockImplementation(async (id: string) => {
    if (lease === id) lease = undefined;
  });
  const room = await draft();
  expect(lease).toBe(room.roomID);
  expect(jest.getTimerCount()).toBe(1);
  for (const spectator of [undefined, 'other']) {
    const denied = jest.fn();
    await connect(spectator).controlAiRoom(room.roomID, 'stop', denied);
    expect(denied).toHaveBeenCalledWith({ error: 'AI room access denied' });
    expect(room.ai?.status).toBe('ready');
    expect(lease).toBe(room.roomID);
  }
  const stopped = jest.fn();
  await connect('owner').controlAiRoom(room.roomID, 'stop', stopped);
  expect(stopped).toHaveBeenCalledWith({ ok: true });
  expect(room.ai?.status).toBe('stopped');
  expect(room.ai).not.toHaveProperty('launchExpiresAt');
  expect(jest.getTimerCount()).toBe(0);
  expect(lease).toBeUndefined();
  expect(host.rooms[room.roomID]).toBe(room);
  const next = await draft('other');
  expect(next.roomID).not.toBe(room.roomID);
  expect(lease).toBe(next.roomID);
  expect(next.ai?.status).toBe('ready');
  expect(run).not.toHaveBeenCalled();
  jest.clearAllTimers();
});

test.each([
  ['smart', 'gpt-6.1-sol', 'medium'],
  ['regular', 'gpt-6-luna', 'medium'],
])('start applies %s settings and language to the same ready room', async (difficulty, model, reasoning) => {
  const { draft, connect, claim, host } = fixture();
  const room = await draft();
  const handlers = connect('owner');
  expect(handlers.startHumanAiRoom).toBeDefined();
  const response = jest.fn();
  await handlers.startHumanAiRoom(room.roomID, { difficulty, language: 'ru' }, response);
  expect(response).toHaveBeenCalledWith({ ok: true });
  expect(Object.keys(host.rooms)).toEqual([room.roomID]);
  expect(room.ai).toMatchObject({
    botDifficulty: difficulty,
    codex: { model, reasoning },
    language: 'ru',
    status: 'running',
  });
  expect(room.ai).not.toHaveProperty('launchExpiresAt');
  expect(room.data.stage).toBe('started');
  expect(run).toHaveBeenCalledTimes(1);
  expect(claim).toHaveBeenCalledWith(room.roomID);
});

test.each([
  ['smart', 60, 6],
  ['smart', 61, 5],
  ['regular', 30, 4],
  ['regular', 31, 3],
  ['regular', Number.NaN, 10],
  ['regular', 90, Number.POSITIVE_INFINITY],
])(
  '%s rechecks quota at start and denies threshold or invalid quota %s / %s',
  async (difficulty, shortTerm, weekly) => {
    const { draft, connect, claim } = fixture();
    const room = await draft();
    claim.mockClear();
    quota.mockResolvedValue({ remainingPercent: weekly, shortTerm: { remainingPercent: shortTerm } });
    const response = jest.fn();
    await connect('owner').startHumanAiRoom(room.roomID, { difficulty, language: 'en' }, response);
    expect(response.mock.calls[0][0]).toHaveProperty('error');
    expect(room.ai?.status).toBe('ready');
    expect(claim).not.toHaveBeenCalled();
  },
);

test.each([null, { remainingPercent: 10, resetsAt: null, checkedAt: 0 }])(
  'unknown quota prevents even preparation',
  async (weekly) => {
    quota.mockResolvedValue(weekly);
    const { connect, host } = fixture();
    const response = jest.fn();
    await connect('owner').createHumanAiRoom(response);
    expect(response).toHaveBeenCalled();
    expect(response.mock.calls[0][0]).toHaveProperty('error');
    expect(Object.keys(host.rooms)).toHaveLength(0);
  },
);

test.each(['regular', 'smart'] as const)('weekly-only accounts can prepare and start %s bots', async (difficulty) => {
  quota.mockResolvedValue({ remainingPercent: 93, resetsAt: null, checkedAt: Date.now(), shortTerm: null });
  const { connect, host } = fixture();
  const handlers = connect('owner');
  const access = jest.fn();
  await handlers.getAiRoomAccess(access);
  expect(access.mock.calls[0][0].botModes).toEqual({ regular: true, smart: true, beginner: true });
  const response = jest.fn();
  await handlers.createHumanAiRoom({ beginner: false, difficulty, language: 'en', playerCount: 5 }, response);
  const id = response.mock.calls[0][0].roomID;
  expect(id).toBeDefined();
  const started = jest.fn();
  await handlers.startHumanAiRoom(id, { difficulty, language: 'en', playerCount: 5 }, started);
  expect(started.mock.calls[0][0]).not.toHaveProperty('error');
  expect(host.rooms[id].ai?.status).toBe('running');
});

test('weekly-only accounts still honor weekly quota thresholds and reset time', async () => {
  const reset = Date.now() / 1000 + 3600;
  quota.mockResolvedValue({ remainingPercent: 2, resetsAt: reset, checkedAt: Date.now(), shortTerm: null });
  const { connect } = fixture();
  const access = jest.fn();
  await connect('owner').getAiRoomAccess(access);
  expect(access.mock.calls[0][0].botModes).toEqual({ regular: false, smart: false, beginner: true });
  expect(access.mock.calls[0][0].botModeAvailableAt).toEqual({ regular: reset * 1000, smart: reset * 1000 });
});

test('a ready room is reused by its owner and prevents another party reserving the slot', async () => {
  const { draft, connect, host, claim } = fixture();
  const first = await draft();
  expect(await draft()).toBe(first);
  const response = jest.fn();
  await connect('other').createHumanAiRoom(response);
  expect(response.mock.calls[0][0]).toHaveProperty('error');
  expect(Object.keys(host.rooms)).toHaveLength(1);
  expect(claim).toHaveBeenCalledTimes(1);
  const access = jest.fn();
  await connect('owner').getAiRoomAccess(access);
  expect(access.mock.calls[0][0]).toEqual({
    canManage: false,
    canPlay: true,
    canPlayLargeTables: false,
    ownRoomID: first.roomID,
    botModes: { smart: true, regular: true, beginner: true },
  });
  await connect('other').getAiRoomAccess(access);
  expect(access.mock.calls[1][0]).toEqual({
    canManage: false,
    canPlay: true,
    canPlayLargeTables: false,
    botsBusy: true,
    botModes: { smart: false, regular: false, beginner: false },
  });
});

test('unavailable quota does not report bots as occupied', async () => {
  quota.mockResolvedValue(null);
  const { connect } = fixture();
  const access = jest.fn();
  await connect('owner').getAiRoomAccess(access);
  expect(access.mock.calls[0][0].botModes).toEqual({ smart: false, regular: false, beginner: false });
  expect(access.mock.calls[0][0].botsBusy).not.toBe(true);
});

test.each([undefined, 'missing', 'avalon-agent-1', 'avalon-ai-1'])(
  'ineligible identity %s cannot prepare a public match',
  async (userID) => {
    const { connect, host, claim } = fixture(userID === 'avalon-agent-1' ? userID : 'admin');
    const response = jest.fn();
    await connect(userID).createHumanAiRoom(response);
    expect(response).toHaveBeenCalled();
    expect(response.mock.calls[0][0]).toHaveProperty('error');
    expect(Object.keys(host.rooms)).toHaveLength(0);
    expect(claim).not.toHaveBeenCalled();
    const access = jest.fn();
    await connect(userID).getAiRoomAccess(access);
    expect(access.mock.calls[0][0].canPlay).not.toBe(true);
  },
);

test('only the human owner may start; generic start and admin reconfiguration are denied', async () => {
  const { draft, connect, claim } = fixture();
  const room = await draft();
  claim.mockClear();
  const response = jest.fn();
  await connect('other').startHumanAiRoom(room.roomID, { difficulty: 'regular', language: 'ru' }, response);
  await connect('admin').startHumanAiRoom(room.roomID, { difficulty: 'regular', language: 'ru' }, response);
  await connect('owner').controlAiRoom(room.roomID, 'start', response);
  await connect('admin').configureAiCodex(room.roomID, { model: 'gpt-6.1-sol', reasoning: 'medium' }, response);
  expect(response.mock.calls).toHaveLength(4);
  for (const [result] of response.mock.calls) expect(result).toHaveProperty('error');
  expect(claim).not.toHaveBeenCalled();
  expect(room.ai?.status).toBe('ready');
});

test('technical resume retains selected model without applying a new-match quota gate', async () => {
  const { draft, connect } = fixture();
  const room = await draft();
  await connect('owner').startHumanAiRoom(room.roomID, { difficulty: 'regular', language: 'ru' }, jest.fn());
  await new Promise<void>((resolve) => setImmediate(resolve));
  room.ai!.status = 'paused';
  room.ai!.canResumeTechnical = true;
  quota.mockResolvedValue(null);
  quota.mockClear();
  const response = jest.fn();
  await connect('owner').controlAiRoom(room.roomID, 'resumeTechnical', response);
  expect(response).toHaveBeenCalledWith({ ok: true });
  expect(quota).not.toHaveBeenCalled();
  expect(room.ai?.codex).toEqual({ model: 'gpt-6-luna', reasoning: 'medium' });
});

test('model catalog support is checked again before starting', async () => {
  const { draft, connect, claim } = fixture();
  const room = await draft();
  claim.mockClear();
  modelCatalog.mockResolvedValue([{ id: 'gpt-6-luna', label: 'Luna', efforts: ['high'] }]);
  const response = jest.fn();
  await connect('owner').startHumanAiRoom(room.roomID, { difficulty: 'regular', language: 'en' }, response);
  expect(response.mock.calls[0][0]).toHaveProperty('error');
  expect(claim).not.toHaveBeenCalled();
});

test('concurrent starts claim the execution slot once', async () => {
  const { draft, connect, claim } = fixture();
  const room = await draft();
  claim.mockClear();
  let releaseQuota!: (value: any) => void;
  quota.mockImplementation(() => new Promise((resolve) => (releaseQuota = resolve)));
  const response = jest.fn();
  const pending = connect('owner').startHumanAiRoom(room.roomID, { difficulty: 'regular', language: 'en' }, response);
  await new Promise<void>((resolve) => setImmediate(resolve));
  await connect('owner').startHumanAiRoom(room.roomID, { difficulty: 'regular', language: 'en' }, response);
  expect(response.mock.calls[0][0]).toHaveProperty('error');
  releaseQuota({ remainingPercent: 10, shortTerm: { remainingPercent: 90 } });
  await pending;
  expect(response.mock.calls[1][0]).toEqual({ ok: true });
  expect(claim).toHaveBeenCalledTimes(1);
});

test('the ready reservation expires after one minute and releases its slot', async () => {
  jest.useFakeTimers();
  const { draft, release, connect } = fixture();
  const room = await draft();
  await jest.advanceTimersByTimeAsync(59999);
  expect(room.ai?.status).toBe('ready');
  await jest.advanceTimersByTimeAsync(1);
  expect(room.ai?.status).toBe('stopped');
  expect(room.ai).not.toHaveProperty('launchExpiresAt');
  expect(release).toHaveBeenCalledWith(room.roomID);
  const response = jest.fn();
  await connect('owner').startHumanAiRoom(room.roomID, { difficulty: 'regular', language: 'en' }, response);
  expect(response.mock.calls[0][0]).toHaveProperty('error');
  expect(run).not.toHaveBeenCalled();
  expect((await draft('other')).ai?.status).toBe('ready');
});

test('quota lookup finishing after the launch deadline cannot start the expired room', async () => {
  jest.useFakeTimers();
  const { draft, connect, claim } = fixture();
  const room = await draft();
  claim.mockClear();
  let releaseQuota!: (value: any) => void;
  quota.mockImplementation(() => new Promise((resolve) => (releaseQuota = resolve)));
  const response = jest.fn();
  const pending = connect('owner').startHumanAiRoom(room.roomID, { difficulty: 'regular', language: 'en' }, response);
  await jest.advanceTimersByTimeAsync(60000);
  releaseQuota({ remainingPercent: 10, shortTerm: { remainingPercent: 90 } });
  await pending;
  expect(response.mock.calls[0][0]).toHaveProperty('error');
  expect(claim).not.toHaveBeenCalled();
  expect(run).not.toHaveBeenCalled();
});

test('an expired launch releases its slot and a late response cannot clear the next start lock', async () => {
  jest.useFakeTimers();
  const { draft, connect } = fixture();
  const room = await draft();
  let releaseQuota!: (value: any) => void;
  quota.mockImplementationOnce(() => new Promise((resolve) => (releaseQuota = resolve)));
  const expiredResponse = jest.fn();
  const pending = connect('owner').startHumanAiRoom(
    room.roomID,
    { difficulty: 'regular', language: 'en' },
    expiredResponse,
  );
  await jest.advanceTimersByTimeAsync(60000);
  const prepared = jest.fn();
  await connect('other').createHumanAiRoom(prepared);
  expect(prepared.mock.calls[0][0]).toHaveProperty('roomID');
  const nextID = prepared.mock.calls[0][0].roomID;
  let releaseNextQuota!: (value: any) => void;
  quota.mockImplementationOnce(() => new Promise((resolve) => (releaseNextQuota = resolve)));
  const nextResponse = jest.fn();
  const nextPending = connect('other').startHumanAiRoom(
    nextID,
    { difficulty: 'regular', language: 'en' },
    nextResponse,
  );
  await jest.advanceTimersByTimeAsync(0);
  releaseQuota({ remainingPercent: 10, shortTerm: { remainingPercent: 90 } });
  await pending;
  const duplicate = jest.fn();
  await connect('other').startHumanAiRoom(nextID, { difficulty: 'regular', language: 'en' }, duplicate);
  expect(duplicate.mock.calls[0][0]).toHaveProperty('error');
  expect(expiredResponse.mock.calls[0][0]).toHaveProperty('error');
  expect(run).not.toHaveBeenCalled();
  releaseNextQuota({ remainingPercent: 10, shortTerm: { remainingPercent: 90 } });
  await nextPending;
  expect(nextResponse).toHaveBeenCalledWith({ ok: true });
  expect(run).toHaveBeenCalledTimes(1);
});

test('preparation respects the manager room cap', async () => {
  const { connect, host } = fixture();
  for (let i = 0; i < 500; i++) host.rooms[`existing-${i}`] = {} as Room;
  const response = jest.fn();
  await connect('owner').createHumanAiRoom(response);
  expect(response).toHaveBeenCalled();
  expect(response.mock.calls[0][0]).toHaveProperty('error');
  expect(Object.keys(host.rooms)).toHaveLength(500);
});

test.each([
  [10, 60, 1100000, 1010800, { smart: 1010800000 }],
  [5, 90, 1100000, 1010800, { smart: 1100000000 }],
  [2, 10, 1100000, 1010800, { smart: 1100000000, regular: 1100000000, beginner: 1010800000 }],
  [10, 90, 1100000, 1010800, {}],
  [2, 10, null, 1010800, { beginner: 1010800000 }],
  [10, 70, 1100000, 999999, {}],
])(
  'public access predicts reset only for blocked quota windows (%s / %s)',
  async (weekly, short, weekReset, shortReset, expected) => {
    jest.useFakeTimers();
    jest.setSystemTime(1000000000);
    quota.mockResolvedValue({
      remainingPercent: weekly,
      resetsAt: weekReset,
      shortTerm: { remainingPercent: short, resetsAt: shortReset },
    });
    const { connect } = fixture();
    const access = jest.fn();
    await connect('owner').getAiRoomAccess(access);
    expect(access.mock.calls[0][0].botModeAvailableAt || {}).toEqual(expected);
  },
);

test('missing models and occupied slots do not promise availability at a quota reset', async () => {
  quota.mockResolvedValue({
    remainingPercent: 10,
    resetsAt: null,
    shortTerm: { remainingPercent: 70, resetsAt: Date.now() / 1000 + 3600 },
  });
  const { connect, draft } = fixture();
  const access = jest.fn();
  modelCatalog.mockResolvedValue(models.slice(1));
  await connect('owner').getAiRoomAccess(access);
  expect(access.mock.calls[0][0].botModeAvailableAt?.smart).toBeUndefined();
  modelCatalog.mockResolvedValue(models);
  await draft();
  await connect('other').getAiRoomAccess(access);
  expect(access.mock.calls[1][0]).toMatchObject({ botsBusy: true });
  expect(access.mock.calls[1][0].botModeAvailableAt?.smart).toBeUndefined();
});

test.each([5, 6, 7, 8])('public table supports %i seats with server premium admission', async (playerCount) => {
  const { draft, connect } = fixture();
  const owner = playerCount >= 7 ? 'premium' : 'owner';
  const room = await draft(owner);
  const response = jest.fn();
  await connect(owner).startHumanAiRoom(room.roomID, { difficulty: 'regular', language: 'ru', playerCount }, response);
  expect(response).toHaveBeenCalledWith({ ok: true });
  expect(room.players).toHaveLength(playerCount);
  expect(room.players.filter((id) => id === owner)).toHaveLength(1);
  expect(new Set(room.players).size).toBe(playerCount);
  expect(room.ai?.playerCount).toBe(playerCount);
  expect(room.options.addons.ladyOfLake).toBe(playerCount >= 7 ? true : undefined);
});

test.each([7, 8])('non-premium cannot start a %i-player table', async (playerCount) => {
  const { draft, connect } = fixture();
  const room = await draft();
  const response = jest.fn();
  await connect('owner').startHumanAiRoom(
    room.roomID,
    { difficulty: 'regular', language: 'ru', playerCount },
    response,
  );
  expect(response.mock.calls[0][0]).toHaveProperty('error');
  expect(room.ai?.status).toBe('ready');
  expect(room.players).toHaveLength(5);
});

test('beginner preparation pins regular bots and five seats', async () => {
  const { host, connect } = fixture();
  const created = jest.fn();
  await connect('owner').createHumanAiRoom({ beginner: true }, created);
  const room = host.rooms[created.mock.calls[0][0].roomID] as BotRoom;
  expect(room.ai?.beginner).toBe(true);
  for (const options of [
    { difficulty: 'smart', language: 'ru' },
    { difficulty: 'regular', language: 'ru', playerCount: 6 },
  ]) {
    const rejected = jest.fn();
    await connect('owner').startHumanAiRoom(room.roomID, options, rejected);
    expect(rejected.mock.calls[0][0]).toHaveProperty('error');
  }
  const started = jest.fn();
  await connect('owner').startHumanAiRoom(room.roomID, { difficulty: 'regular', language: 'ru' }, started);
  expect(started).toHaveBeenCalledWith({ ok: true });
  expect(room.players).toHaveLength(5);
});

test('large-table access uses the entitlement even with a hidden premium badge', async () => {
  const { connect } = fixture();
  const response = jest.fn();
  await connect('premium').getAiRoomAccess(response);
  expect(response.mock.calls[0][0].canPlayLargeTables).toBe(true);
});

test.each([
  [999, false],
  [1000, true],
])('paid premium admission at %i cents is %s', async (total, allowed) => {
  jest.mocked(support.supportTotalCents).mockResolvedValue(total as number);
  const { draft, connect } = fixture();
  const room = await draft();
  const result = jest.fn();
  await connect('owner').startHumanAiRoom(
    room.roomID,
    { difficulty: 'regular', language: 'ru', playerCount: 8 },
    result,
  );
  expect(result.mock.calls[0][0]).toEqual(
    allowed ? { ok: true } : { error: 'Premium is required for seven or eight players' },
  );
});

test.each([2, 3])(
  'friend mode requires %i humans before launch and lets each human find their room',
  async (humanSeats) => {
    const { host, connect } = fixture('admin', true);
    const created = jest.fn();
    await connect('owner').createHumanAiRoom({ beginner: false, withFriend: true, humanSeats }, created);
    const result = created.mock.calls[0][0];
    expect(result).toHaveProperty('roomID');
    const room = host.rooms[result.roomID] as BotRoom;
    const rejected = jest.fn();
    await connect('owner').startHumanAiRoom(room.roomID, { difficulty: 'regular', language: 'ru' }, rejected);
    expect(rejected.mock.calls[0][0]).toHaveProperty('error');
    room.joinGame('friend');
    if (humanSeats === 3) {
      await connect('owner').startHumanAiRoom(room.roomID, { difficulty: 'regular', language: 'ru' }, rejected);
      expect(rejected.mock.calls[1][0]).toHaveProperty('error');
      room.joinGame('friend2');
    }
    expect(() => room.joinGame('extra')).toThrow();
    room.leaveGame('friend');
    expect(room.players).toContain('owner');
    if (humanSeats === 3) expect(room.players).toContain('friend2');
    room.joinGame('friend');
    expect(new Set(room.players).size).toBe(5);
    const started = jest.fn();
    await connect('owner').startHumanAiRoom(room.roomID, { difficulty: 'regular', language: 'ru' }, started);
    expect(started.mock.calls[0][0]).toEqual({ ok: true });
    expect(room.players).toContain('friend');
    expect(room.players).toHaveLength(5);
    expect(room.ai!.humanPlayerIDs).toEqual(humanSeats === 3 ? ['owner', 'friend2', 'friend'] : ['owner', 'friend']);
    expect(room.ai!.title).toBe(humanSeats === 3 ? 'Alice + friend2 + friend vs 2 Bots' : 'Alice + friend vs 3 Bots');
    const access = jest.fn();
    await connect('friend').getAiRoomAccess(access);
    expect(access.mock.calls[0][0].ownRoomID).toBe(room.roomID);
    room.stop();
  },
);

test('creation saves the chosen mode, language and size before launch without inference', async () => {
  jest.useFakeTimers();
  const { connect, host } = fixture();
  const response = jest.fn();
  await connect('premium').createHumanAiRoom(
    { beginner: false, withFriend: true, difficulty: 'smart', language: 'ru', playerCount: 8 },
    response,
  );
  expect(response.mock.calls[0][0]).toHaveProperty('roomID');
  const room = host.rooms[response.mock.calls[0][0].roomID] as BotRoom;
  expect(room.players).toHaveLength(8);
  expect(room.ai).toMatchObject({ preparedDifficulty: 'smart', language: 'ru', playerCount: 8, withFriend: true });
  expect(room.ai!.launchExpiresAt).toBe(Date.now() + 120000);
  expect(run).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(119999);
  expect(room.ai!.status).toBe('ready');
  await jest.advanceTimersByTimeAsync(1);
  expect(room.ai!.status).toBe('stopped');
});

test('single-player preparation lasts one minute', async () => {
  jest.useFakeTimers();
  const { draft, release } = fixture();
  const room = await draft();
  expect(room.ai!.launchExpiresAt).toBe(Date.now() + 60000);
  await jest.advanceTimersByTimeAsync(59999);
  expect(room.ai!.status).toBe('ready');
  await jest.advanceTimersByTimeAsync(1);
  expect(room.ai!.status).toBe('stopped');
  expect(release).toHaveBeenCalledWith(room.roomID);
});

test.each([
  { beginner: false, difficulty: 'unknown', language: 'ru', playerCount: 5 },
  { beginner: false, difficulty: 'regular', language: 'unknown', playerCount: 5 },
  { beginner: false, difficulty: 'regular', language: 'ru', playerCount: 7 },
  { beginner: true, difficulty: 'smart', language: 'ru', playerCount: 5 },
  { beginner: true, difficulty: 'regular', language: 'ru', playerCount: 6 },
])('invalid or unentitled setup never reserves the shared slot: %j', async (options) => {
  const { connect, claim } = fixture();
  const response = jest.fn();
  await connect('owner').createHumanAiRoom(options, response);
  expect(response.mock.calls[0][0]).toHaveProperty('error');
  expect(claim).not.toHaveBeenCalled();
});

test('a prepared setup cannot be changed by a different launch payload', async () => {
  const { connect, host } = fixture();
  const created = jest.fn();
  await connect('owner').createHumanAiRoom(
    { beginner: false, difficulty: 'regular', language: 'ru', playerCount: 6 },
    created,
  );
  const room = host.rooms[created.mock.calls[0][0].roomID] as BotRoom;
  for (const options of [
    { difficulty: 'smart', language: 'ru', playerCount: 6 },
    { difficulty: 'regular', language: 'en', playerCount: 6 },
    { difficulty: 'regular', language: 'ru', playerCount: 5 },
  ]) {
    const result = jest.fn();
    await connect('owner').startHumanAiRoom(room.roomID, options, result);
    expect(result.mock.calls[0][0]).toHaveProperty('error');
    expect(room.ai!.status).toBe('ready');
  }
  expect(run).not.toHaveBeenCalled();
  const started = jest.fn();
  await connect('owner').startHumanAiRoom(
    room.roomID,
    { difficulty: 'regular', language: 'ru', playerCount: 6 },
    started,
  );
  expect(started).toHaveBeenCalledWith({ ok: true });
  room.stop();
});

test.each([
  [21, 2, true],
  [20, 2, false],
  [21, 1, false],
])('first game has independent strict thresholds: %s / %s', async (shortTerm, weekly, allowed) => {
  quota.mockResolvedValue({ remainingPercent: weekly, shortTerm: { remainingPercent: shortTerm } });
  const { connect, host } = fixture();
  const handlers = connect('owner');
  const access = jest.fn();
  await handlers.getAiRoomAccess(access);
  expect(access.mock.calls[0][0].botModes).toEqual({ smart: false, regular: false, beginner: allowed });
  const created = jest.fn();
  await handlers.createHumanAiRoom({ beginner: true, difficulty: 'regular', language: 'en', playerCount: 5 }, created);
  if (!allowed) {
    expect(created.mock.calls[0][0]).toHaveProperty('error');
    return;
  }
  const id = created.mock.calls[0][0].roomID;
  expect(id).toBeDefined();
  const started = jest.fn();
  await handlers.startHumanAiRoom(id, { difficulty: 'regular', language: 'en', playerCount: 5 }, started);
  expect(started).toHaveBeenCalledWith({ ok: true });
  expect(host.rooms[id].ai?.codex).toEqual({ model: 'gpt-6-luna', reasoning: 'low' });
});

test('first game rechecks its own quota at launch', async () => {
  const { connect, host } = fixture('admin', true);
  const handlers = connect('owner');
  const created = jest.fn();
  await handlers.createHumanAiRoom({ beginner: true }, created);
  const id = created.mock.calls[0][0].roomID;
  quota.mockResolvedValue({ remainingPercent: 1, shortTerm: { remainingPercent: 21 } });
  const started = jest.fn();
  await handlers.startHumanAiRoom(id, { difficulty: 'regular', language: 'en' }, started);
  expect(started.mock.calls[0][0]).toHaveProperty('error');
  expect(host.rooms[id].ai?.status).toBe('ready');
});

test('smart bots can prepare and start above 60 percent without waiting for a quota reset', async () => {
  quota.mockResolvedValue({
    remainingPercent: 6,
    resetsAt: Date.now() / 1000 + 86400,
    checkedAt: Date.now(),
    shortTerm: { remainingPercent: 61, resetsAt: Date.now() / 1000 + 3600 },
  });
  const { connect, host } = fixture();
  const handlers = connect('owner');
  const access = jest.fn();
  await handlers.getAiRoomAccess(access);
  expect(access.mock.calls[0][0].botModes.smart).toBe(true);
  expect(access.mock.calls[0][0].botModeAvailableAt?.smart).toBeUndefined();
  const created = jest.fn();
  await handlers.createHumanAiRoom({ beginner: false, difficulty: 'smart', language: 'en', playerCount: 5 }, created);
  const id = created.mock.calls[0][0].roomID;
  expect(id).toBeDefined();
  const started = jest.fn();
  await handlers.startHumanAiRoom(id, { difficulty: 'smart', language: 'en' }, started);
  expect(started).toHaveBeenCalledWith({ ok: true });
  expect(host.rooms[id].ai?.codex).toEqual({ model: 'gpt-6.1-sol', reasoning: 'medium' });
});

test.each([false, true])(
  'solo creation passes the role to the prepared room (socket validation=%s)',
  async (validatePackets) => {
    const { connect, host } = fixture('admin', validatePackets);
    const selected = jest.spyOn(BotRoom.prototype, 'setHumanRole');
    const created = jest.fn();
    await connect('premium').createHumanAiRoom({ beginner: false, role: 'oberon', playerCount: 7 }, created);
    const room = host.rooms[created.mock.calls[0][0].roomID] as BotRoom;
    expect(selected).toHaveBeenCalledWith('oberon');
    expect(() => room.setPlayerCount(8)).toThrow('Selected solo role is unavailable');
    expect(room.players).toHaveLength(7);
    expect(room.ai).not.toHaveProperty('role');
  },
);

test.each([{ role: 'oberon' }, { role: 'minion' }, { role: 'unknown' }, { role: 'merlin', withFriend: true }])(
  'solo creation rejects unavailable roles before claiming a room %#',
  async (options) => {
    const { connect, claim } = fixture();
    const rejected = jest.fn();
    await connect('owner').createHumanAiRoom({ beginner: false, ...options }, rejected);
    expect(rejected).toHaveBeenCalledWith({ error: 'Invalid bot room options' });
    expect(claim).not.toHaveBeenCalled();
  },
);

test.each([5, 6, 7, 8] as const)('friends fill a %i-seat table leaving one bot', async (playerCount) => {
  const { host, connect } = fixture('admin', true);
  const created = jest.fn();
  await connect('premium').createHumanAiRoom(
    {
      beginner: false,
      withFriend: true,
      humanSeats: playerCount - 1,
      playerCount,
      difficulty: 'regular',
      language: 'ru',
    },
    created,
  );
  expect(created.mock.calls[0][0]).toHaveProperty('roomID');
  const room = host.rooms[created.mock.calls[0][0].roomID] as BotRoom;
  try {
    for (let i = 1; i < playerCount - 2; i++) room.joinGame('friend' + i);
    const waiting = jest.fn();
    await connect('premium').startHumanAiRoom(
      room.roomID,
      { difficulty: 'regular', language: 'ru', playerCount },
      waiting,
    );
    expect(waiting.mock.calls[0][0]).toHaveProperty('error');
    room.joinGame('last-friend');
    expect(() => room.joinGame('extra')).toThrow();
    const started = jest.fn();
    await connect('premium').startHumanAiRoom(
      room.roomID,
      { difficulty: 'regular', language: 'ru', playerCount },
      started,
    );
    expect(started.mock.calls[0][0]).toEqual({ ok: true });
    expect(room.players).toHaveLength(playerCount);
    expect(new Set(room.players).size).toBe(playerCount);
    expect(room.players.filter((id) => !room.isHuman(id))).toHaveLength(1);
  } finally {
    room.stop();
  }
});

test.each([1, 5, 6, 2.5, '4', null])('rejects invalid human seats %s for a five-seat table', async (humanSeats) => {
  const { connect, host } = fixture('admin', true);
  const result = jest.fn();
  await connect('owner').createHumanAiRoom({ beginner: false, withFriend: true, humanSeats, playerCount: 5 }, result);
  expect(result.mock.calls[0][0]).toHaveProperty('error');
  expect(Object.keys(host.rooms)).toHaveLength(0);
});

test('legacy friend room cannot shrink to remove its last bot', async () => {
  const { host, connect } = fixture();
  const created = jest.fn();
  await connect('premium').createHumanAiRoom(
    { beginner: false, withFriend: true, humanSeats: 5, playerCount: 6 },
    created,
  );
  const room = host.rooms[created.mock.calls[0][0].roomID] as BotRoom;
  try {
    for (let i = 1; i < 5; i++) room.joinGame('friend' + i);
    expect(() => room.setPlayerCount(5)).toThrow();
    expect(room.players).toHaveLength(6);
  } finally {
    room.stop();
  }
});

test.each(['es', 'vi'] as const)('%s is accepted for public AI room creation and launch', async (language) => {
  const { connect, host } = fixture('admin', true);
  const handlers = connect('owner');
  const created = jest.fn();
  await handlers.createHumanAiRoom({ beginner: false, difficulty: 'regular', language, playerCount: 5 }, created);
  expect(created.mock.calls[0][0]).toHaveProperty('roomID');
  const room = host.rooms[created.mock.calls[0][0].roomID] as BotRoom;
  expect(room.ai!.language).toBe(language);
  const started = jest.fn();
  await handlers.startHumanAiRoom(room.roomID, { difficulty: 'regular', language, playerCount: 5 }, started);
  expect(started).toHaveBeenCalledWith({ ok: true });
  expect(run).toHaveBeenCalled();
  room.stop();
});

describe('multiple ChatGPT instances', () => {
  const accounts = [
    { id: 'first', home: '/profiles/first' },
    { id: 'second', home: '/profiles/second' },
  ];
  const remaining = (short: number, weekly: number) => ({
    remainingPercent: weekly,
    checkedAt: Date.now(),
    resetsAt: null,
    shortTerm: { remainingPercent: short, resetsAt: null },
  });
  beforeEach(() => {
    process.env.AI_CODEX_INSTANCES = JSON.stringify(accounts);
  });

  test('reserves the free eligible instance with the highest short quota before weekly quota', async () => {
    quota.mockResolvedValueOnce(remaining(70, 90)).mockResolvedValueOnce(remaining(80, 10));
    const { draft, claim } = fixture();
    const room = await draft();
    expect(claim).toHaveBeenCalledWith(room.roomID, 'second');
    expect(JSON.stringify(room.calculateRoomState())).not.toContain('/profiles/');
  });

  test('allows two simultaneous parties, rejects a third, and reuses only the released instance', async () => {
    jest.useFakeTimers();
    const { draft, connect, claim } = fixture();
    const first = await draft('owner');
    const second = await draft('other');
    expect(second.roomID).not.toBe(first.roomID);
    expect(claim.mock.calls.map((args) => (args as unknown[])[1])).toEqual(['first', 'second']);
    const denied = jest.fn();
    await connect('third').createHumanAiRoom(denied);
    expect(denied.mock.calls[0][0]).toHaveProperty('error');
    await connect('owner').controlAiRoom(first.roomID, 'stop', jest.fn());
    const third = await draft('third');
    expect(claim).toHaveBeenLastCalledWith(third.roomID, 'first');
    expect(second.ai?.status).toBe('ready');
    jest.clearAllTimers();
  });

  test('shows available bot modes while another instance is occupied and finds each participant own room', async () => {
    const { draft, connect } = fixture();
    const first = await draft('owner');
    const access = jest.fn();
    await connect('other').getAiRoomAccess(access);
    expect(access.mock.calls[0][0].botsBusy).not.toBe(true);
    expect(access.mock.calls[0][0].botModes.smart).toBe(true);
    const second = await draft('other');
    await connect('other').getAiRoomAccess(access);
    expect(access.mock.calls[1][0].ownRoomID).toBe(second.roomID);
    await connect('owner').getAiRoomAccess(access);
    expect(access.mock.calls[2][0].ownRoomID).toBe(first.roomID);
  });

  test('concurrent starts of different rooms proceed independently', async () => {
    const { draft, connect } = fixture();
    const first = await draft('owner');
    const second = await draft('other');
    const responses = [jest.fn(), jest.fn()];
    await Promise.all([
      connect('owner').startHumanAiRoom(first.roomID, { difficulty: 'regular', language: 'en' }, responses[0]),
      connect('other').startHumanAiRoom(second.roomID, { difficulty: 'regular', language: 'en' }, responses[1]),
    ]);
    expect(responses.map((cb) => cb.mock.calls[0][0])).toEqual([{ ok: true }, { ok: true }]);
    expect(first.ai?.status).toBe('running');
    expect(second.ai?.status).toBe('running');
  });
});

describe('instance reservation lifecycle', () => {
  beforeEach(() => {
    process.env.AI_CODEX_INSTANCES = JSON.stringify([
      { id: 'first', home: '/profiles/first' },
      { id: 'second', home: '/profiles/second' },
    ]);
  });

  test('the pinned profile survives another account getting more quota and technical resume', async () => {
    const { codexEnvironment } = await import('./codex-instances');
    const { draft, connect } = fixture();
    const room = await draft();
    const profiles: (string | undefined)[] = [];
    run.mockImplementation(async function (this: BotRoom) {
      profiles.push(codexEnvironment().AI_CODEX_HOME);
      this.ai!.status = 'paused';
      this.ai!.canResumeTechnical = true;
    });
    const response = jest.fn();
    await connect('owner').startHumanAiRoom(room.roomID, { difficulty: 'regular', language: 'en' }, response);
    await new Promise<void>((resolve) => setImmediate(resolve));
    await draft('other');
    const denied = jest.fn();
    await connect('third').createHumanAiRoom(denied);
    expect(denied.mock.calls[0][0]).toHaveProperty('error');
    await connect('owner').controlAiRoom(room.roomID, 'resumeTechnical', response);
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(response.mock.calls.map(([value]) => value)).toEqual([{ ok: true }, { ok: true }]);
    expect(profiles).toEqual(['/profiles/first', '/profiles/first']);
    await connect('owner').controlAiRoom(room.roomID, 'stop', jest.fn());
    await connect('other').controlAiRoom((await draft('other')).roomID, 'stop', jest.fn());
  });

  test('ties are resolved by weekly quota and accounts below the selected mode thresholds are skipped', async () => {
    const { connect, claim } = fixture();
    quota
      .mockResolvedValueOnce({ remainingPercent: 50, shortTerm: { remainingPercent: 90 } })
      .mockResolvedValueOnce({ remainingPercent: 60, shortTerm: { remainingPercent: 90 } });
    const created = jest.fn();
    await connect('owner').createHumanAiRoom({ beginner: false, difficulty: 'smart' }, created);
    const id = created.mock.calls[0][0].roomID;
    expect(claim).toHaveBeenCalledWith(id, 'second');
    await connect('owner').controlAiRoom(id, 'stop', jest.fn());
    claim.mockClear();
    quota
      .mockResolvedValueOnce({ remainingPercent: 5, shortTerm: { remainingPercent: 100 } })
      .mockResolvedValueOnce({ remainingPercent: 6, shortTerm: { remainingPercent: 61 } });
    await connect('other').createHumanAiRoom({ beginner: false, difficulty: 'smart' }, created);
    expect(claim).toHaveBeenCalledWith(created.mock.calls[1][0].roomID, 'second');
  });

  test('simultaneous creators reserve different instances and a concurrent duplicate creator spends only one slot', async () => {
    const { connect, claim, host } = fixture();
    const responses = [jest.fn(), jest.fn(), jest.fn()];
    await Promise.all([
      connect('owner').createHumanAiRoom(responses[0]),
      connect('other').createHumanAiRoom(responses[1]),
      connect('owner').createHumanAiRoom(responses[2]),
    ]);
    expect(responses.slice(0, 2).map((cb) => cb.mock.calls[0][0])).toEqual([
      { roomID: expect.any(String) },
      { roomID: expect.any(String) },
    ]);
    expect(claim.mock.calls.map((args) => (args as unknown[])[1]).sort()).toEqual(['first', 'second']);
    expect(Object.keys(host.rooms)).toHaveLength(2);
  });
});

test('named spectator preparation renews its account reservation beyond the lease duration and stops renewing after cancellation', async () => {
  jest.useFakeTimers();
  process.env.AI_CODEX_INSTANCES = JSON.stringify([{ id: 'one', home: '/profiles/one' }]);
  const { connect, service, host } = fixture();
  const renew = jest.spyOn(service.repository!, 'renewLease');
  const response = jest.fn();
  await connect('admin').createAiRoom('codex-chatgpt', response);
  const id = response.mock.calls[0][0].roomID;
  expect(id).toBeDefined();
  await jest.advanceTimersByTimeAsync(23 * 60000);
  expect(renew).toHaveBeenCalledWith(id);
  expect(renew.mock.calls.length).toBeGreaterThanOrEqual(23);
  expect(host.rooms[id].ai?.status).toBe('ready');
  await connect('admin').controlAiRoom(id, 'stop', jest.fn());
  const calls = renew.mock.calls.length;
  await jest.advanceTimersByTimeAsync(23 * 60000);
  expect(renew).toHaveBeenCalledTimes(calls);
});

test('nonpublic pool allocation skips accounts with an exhausted short quota', async () => {
  process.env.AI_CODEX_INSTANCES = JSON.stringify([
    { id: 'one', home: '/profiles/one' },
    { id: 'two', home: '/profiles/two' },
  ]);
  quota
    .mockResolvedValueOnce({ remainingPercent: 90, shortTerm: { remainingPercent: 0 } })
    .mockResolvedValueOnce({ remainingPercent: 10, shortTerm: { remainingPercent: 0 } });
  const { connect } = fixture();
  const response = jest.fn();
  await connect('admin').createAiRoom('codex-chatgpt', response);
  expect(response.mock.calls[0][0]).toHaveProperty('error');
});
