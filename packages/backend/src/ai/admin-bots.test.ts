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
    getBotQuotaThresholds: async () => thresholds,
    setBotQuotaThresholds: async (value: typeof thresholds) => {
      thresholds = value;
    },
  } as unknown as AiRepository;
  async function request(userID?: string, value?: unknown) {
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
    if (value !== undefined) await events.setAiBotQuotaThresholds(value, response);
    else await events.getAiBotDashboard(response);
    return response.mock.calls[0][0];
  }
  return {
    host,
    games,
    request,
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
