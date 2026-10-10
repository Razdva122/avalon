/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Manager } from '@/main';
import { Room } from '@/room';
import type { Server, ServerSocket } from '@avalon/types';
import { AiService } from './service';
import { BotRoom } from './room';
import type { AiRepository } from './repository';
import * as limits from './codex-limits';
import * as catalog from './codex-models';

const initialEnvironment = { ...process.env };
const models = [
  { id: 'gpt-6.1-sol', label: 'Sol', efforts: ['medium'] },
  { id: 'gpt-6-luna', label: 'Luna', efforts: ['low'] },
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

function fixture(adminID = 'admin') {
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const claim = jest.fn<Promise<void>, [string]>(async () => {});
  const release = jest.fn<Promise<void>, [string]>(async () => {});
  const save = jest.fn(async () => {});
  const host = {
    rooms: {},
    io,
    updateRoomsList() {},
    dbManager: {
      getUserByID: async (id: string) => {
        if (id === 'missing') throw Error('No user');
        return { id, name: id === 'owner' ? 'Alice' : id, isAdmin: id === adminID };
      },
    },
  } as unknown as Manager;
  const service = new AiService(host);
  service.repository = { claim, release, save } as unknown as AiRepository;
  function connect(id?: string) {
    const handlers: Record<string, (...args: any[]) => Promise<void>> = {};
    service.register(
      { on: (event: string, handler: any) => (handlers[event] = handler) } as unknown as ServerSocket,
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
  ['regular', 'gpt-6-luna', 'low'],
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
  ['smart', 80, 6],
  ['smart', 81, 5],
  ['regular', 20, 3],
  ['regular', 21, 2],
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
    ownRoomID: first.roomID,
    botModes: { smart: true, regular: true },
  });
  await connect('other').getAiRoomAccess(access);
  expect(access.mock.calls[1][0]).toEqual({
    canManage: false,
    canPlay: true,
    botModes: { smart: false, regular: false },
  });
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
  expect(room.ai?.codex).toEqual({ model: 'gpt-6-luna', reasoning: 'low' });
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

test('the ready reservation expires after ninety seconds and releases its slot', async () => {
  jest.useFakeTimers();
  const { draft, release, connect } = fixture();
  const room = await draft();
  await jest.advanceTimersByTimeAsync(89999);
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
  await jest.advanceTimersByTimeAsync(90000);
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
  await jest.advanceTimersByTimeAsync(90000);
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
