/* eslint-disable @typescript-eslint/no-explicit-any */
import { AiService } from './service';
import { BotRoom } from './room';
import { codexEnvironment } from './codex-instances';
import * as limits from './codex-limits';
import * as catalog from './codex-models';
import type { Manager } from '@/main';
import type { AiRepository } from './repository';
import type { Server, ServerSocket } from '@avalon/types';

const environment = { ...process.env };
beforeEach(() => {
  process.env.NODE_ENV = 'development';
  process.env.AI_CODEX_ENABLED = 'true';
  process.env.AI_CODEX_INSTANCES = JSON.stringify([
    { id: 'one', home: '/pool/one' },
    { id: 'two', home: '/pool/two' },
    { id: 'three', home: '/pool/three' },
  ]);
  jest.spyOn(limits, 'getCodexWeeklyLimit').mockImplementation(async () => {
    if (codexEnvironment().AI_CODEX_HOME === '/pool/three') throw Error('offline');
    return { remainingPercent: 80, resetsAt: null, checkedAt: 123, shortTerm: null };
  });
  jest
    .spyOn(catalog, 'getCodexModels')
    .mockResolvedValue([{ id: 'gpt-6-luna', label: 'Luna', efforts: ['low', 'medium'] }]);
});
afterEach(() => {
  jest.restoreAllMocks();
  process.env = { ...environment };
});

function fixture() {
  let admin = true;
  const games: import('@avalon/types').AiGameUsage[] = [];
  let thresholds = {
    smart: { shortTerm: 60, weekly: 5 },
    regular: { shortTerm: 30, weekly: 3 },
    beginner: { shortTerm: 20, weekly: 1 },
  };
  const host = {
    rooms: {},
    dbManager: { getUserByID: async () => ({ isAdmin: admin }) },
  } as unknown as Manager;
  const service = new AiService(host);
  service.repository = {
    busyInstances: async () => [{ instanceID: 'one', roomID: 'remote-room' }],
    recentGameUsage: async () => games,
    weeklyAccountUsage: async () => [],
    getBotQuotaThresholds: async () => thresholds,
    setBotQuotaThresholds: async (value: typeof thresholds) => {
      thresholds = value;
    },
  } as unknown as AiRepository;
  async function request(userID?: string, value?: unknown, reset?: unknown) {
    const events: Record<string, (...args: any[]) => Promise<void>> = {};
    service.register(
      {
        on: (event: string, handler: any) => {
          events[event] = handler;
        },
      } as unknown as ServerSocket,
      userID,
    );
    expect(events.getAiBotDashboard).toBeDefined();
    const response = jest.fn();
    if (reset !== undefined) await events.consumeAiBotReset(reset, response);
    else if (value !== undefined) await events.setAiBotQuotaThresholds(value, response);
    else await events.getAiBotDashboard(response);
    return response.mock.calls[0][0];
  }
  return {
    host,
    games,
    request,
    reset: (userID: string | undefined, value: unknown) => request(userID, undefined, value),
    revoke: () => {
      admin = false;
    },
  };
}

test('dashboard requires current database admin authority, including after revocation', async () => {
  const f = fixture();
  expect(await f.request()).toEqual({ error: 'AI room access denied' });
  expect(await f.request('admin')).toHaveProperty('instances');
  f.revoke();
  expect(await f.request('admin')).toEqual({ error: 'AI room access denied' });
});

test('only a current admin can consume an account reset and fresh quotas update its statistics', async () => {
  const consume = jest.spyOn(limits, 'consumeCodexReset').mockImplementation(async () => {
    expect(codexEnvironment().AI_CODEX_HOME).toBe('/pool/two');
    return 'reset';
  });
  const f = fixture();
  const value = {
    instanceID: 'two',
    idempotencyKey: '8ae96ff3-3425-4f4c-8772-b6fd61502868',
    creditId: 'RateLimitResetCredit_1',
  };
  expect(await f.reset(undefined, value)).toEqual({ error: 'AI room access denied' });
  expect(consume).not.toHaveBeenCalled();
  expect(await f.reset('admin', { ...value, instanceID: 'absent' })).toEqual({ error: 'Unknown bot account' });
  expect(await f.reset('admin', { ...value, idempotencyKey: 'bad' })).toEqual({ error: 'Invalid reset request' });
  expect(consume).not.toHaveBeenCalled();
  expect(await f.reset('admin', value)).toEqual({ outcome: 'reset' });
  expect(consume).toHaveBeenCalledWith({ idempotencyKey: value.idempotencyKey, creditId: value.creditId });
  expect(limits.getCodexWeeklyLimit).toHaveBeenCalledWith(true);
  f.revoke();
  expect(await f.reset('admin', value)).toEqual({ error: 'AI room access denied' });
  expect(consume).toHaveBeenCalledTimes(1);
});

test('reset outcomes are preserved and failed requests do not leave the account locked', async () => {
  const consume = jest.spyOn(limits, 'consumeCodexReset');
  const f = fixture();
  const value = { instanceID: 'one', idempotencyKey: '8ae96ff3-3425-4f4c-8772-b6fd61502868' };
  consume.mockRejectedValueOnce(Error('transport failed'));
  expect(await f.reset('admin', value)).toEqual({ error: 'Could not apply bot reset' });
  for (const outcome of ['alreadyRedeemed', 'nothingToReset', 'noCredit'] as const) {
    consume.mockResolvedValueOnce(outcome);
    expect(await f.reset('admin', value)).toEqual({ outcome });
  }
  expect(consume.mock.calls.every(([request]) => request.idempotencyKey === value.idempotencyKey)).toBe(true);
});

test('dashboard includes occupied cross-process instances and preserves healthy entries when one fails', async () => {
  const result = await fixture().request('admin');
  expect(result.checkedAt).toEqual(expect.any(Number));
  expect(result.instances).toEqual([
    expect.objectContaining({
      id: 'one',
      status: 'busy',
      roomID: 'remote-room',
      quota: expect.objectContaining({ remainingPercent: 80 }),
    }),
    expect.objectContaining({ id: 'two', status: 'free', modes: { smart: false, regular: true, beginner: true } }),
    expect.objectContaining({ id: 'three', status: 'unavailable', quota: null }),
  ]);
  expect(JSON.stringify(result)).not.toMatch(/\/pool\/|environment|AI_CODEX_HOME/);
});

test('exhausted quota makes an unoccupied instance unavailable', async () => {
  jest
    .mocked(limits.getCodexWeeklyLimit)
    .mockResolvedValue({ remainingPercent: 0, resetsAt: null, checkedAt: 123, shortTerm: null });
  const result = await fixture().request('admin');
  expect(result.instances.map((entry: any) => entry.status)).toEqual(['busy', 'unavailable', 'unavailable']);
});

test('legacy local rooms report operational details without exposing private game state', async () => {
  delete process.env.AI_CODEX_INSTANCES;
  const f = fixture();
  const room = new BotRoom('local-room', 'admin', {} as Server, async () => ({ choice: 0, speech: '' }));
  room.ai!.status = 'running';
  room.ai!.codex = { model: 'gpt-6-luna', reasoning: 'low' };
  room.ai!.thinkingPlayerID = room.players[0];
  f.host.rooms[room.roomID] = room;
  const result = await f.request('admin');
  expect(result.instances[0]).toMatchObject({
    id: 'default',
    status: 'busy',
    roomID: 'local-room',
    room: { status: 'running', codex: { model: 'gpt-6-luna', reasoning: 'low' }, playerCount: 7, thinking: true },
  });
  expect(result.instances[0].room).not.toHaveProperty('players');
  expect(result.instances[0].room).not.toHaveProperty('decisions');
});

test('revocation while metadata loads prevents returning private data', async () => {
  const f = fixture();
  jest.mocked(catalog.getCodexModels).mockImplementation(async () => {
    f.revoke();
    return [];
  });
  expect(await f.request('admin')).toEqual({ error: 'AI room access denied' });
});

test('only admins can change thresholds and saved values govern the next availability snapshot', async () => {
  const f = fixture();
  const thresholds = {
    smart: { shortTerm: 60, weekly: 5 },
    regular: { shortTerm: 30, weekly: 90 },
    beginner: { shortTerm: 20, weekly: 90 },
  };
  expect(await f.request(undefined, thresholds)).toEqual({ error: 'AI room access denied' });
  expect(await f.request('admin', thresholds)).toEqual({ ok: true });
  const result = await f.request('admin');
  expect(result.thresholds).toEqual(thresholds);
  expect(result.instances[1].status).toBe('unavailable');
  expect(await f.request('admin', { ...thresholds, beginner: { weekly: -1, shortTerm: 0 } })).toHaveProperty('error');
  expect((await f.request('admin')).thresholds).toEqual(thresholds);
});

test('usage history marks abandoned games stopped while keeping another process live game active', async () => {
  const f = fixture();
  f.games.push(
    ...([
      { roomID: 'remote-room', instanceID: 'one', status: 'running' },
      { roomID: 'abandoned-room', instanceID: 'two', status: 'paused' },
      { roomID: 'completed-room', instanceID: 'two', status: 'finished' },
    ] as import('@avalon/types').AiGameUsage[]),
  );
  const result = await f.request('admin');
  expect(result.games.map((game: import('@avalon/types').AiGameUsage) => game.status)).toEqual([
    'running',
    'stopped',
    'finished',
  ]);
});
