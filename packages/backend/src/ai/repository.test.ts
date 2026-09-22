import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { MongoClient } from 'mongodb';
import { AiRepository } from './repository';
let server: MongoMemoryServer;
let client: MongoClient;
beforeAll(async () => {
  server = await MongoMemoryServer.create();
  client = await MongoClient.connect(server.getUri());
});
afterAll(async () => {
  await client?.close();
  await server?.stop();
});
test('atomic reservations cannot exceed the shared budget and survive a new repository instance', async () => {
  const db = client.db('budget');
  const repo = new AiRepository(db, 1, 1);
  await repo.claim('match');
  const attempts = await Promise.allSettled(Array.from({ length: 10 }, () => repo.reserve('match', 2000)));
  expect(attempts.filter((a) => a.status === 'fulfilled')).toHaveLength(5);
  expect(await new AiRepository(db, 1, 1).roomCost('match')).toBe(1);
  await expect(repo.reserve('match', 1)).rejects.toThrow();
  await repo.settle('match', 2000, 500);
  expect(await repo.roomCost('match')).toBe(0.85);
  await expect(repo.claim('other-match')).rejects.toThrow();
});
test('per-room cap and missing lease reject requests before charging', async () => {
  const repo = new AiRepository(client.db('perroom'), 2, 0.5);
  await repo.claim('room');
  await repo.reserve('room', 5000);
  await expect(repo.reserve('room', 1)).rejects.toThrow();
  await expect(repo.reserve('not-owner', 100)).rejects.toThrow();
  expect(await repo.roomCost('room')).toBe(0.5);
});

test('recent AI replays survive a repository restart and are returned newest first with a limit', async () => {
  const db = client.db('replays');
  await db.collection<{ _id: string; state: Record<string, unknown> }>('ai_room_replays').insertMany([
    { _id: 'old', state: { roomID: 'old', createAt: '2026-09-20T12:00:00.000Z', ai: { status: 'finished' } } },
    { _id: 'new', state: { roomID: 'new', createAt: '2026-09-21T12:00:00.000Z', ai: { status: 'paused' } } },
  ]);
  const rooms = await new AiRepository(db).recent(1);
  expect(rooms.map((r) => r.roomID)).toEqual(['new']);
  expect(rooms[0].ai?.status).toBe('stopped');
});

test('request log updates one entry and keeps actual billing separate from the reservation', async () => {
  const db = client.db('request-costs');
  const repo = new AiRepository(db);
  const entry = {
    _id: 'request-1',
    roomID: 'match',
    player: '3',
    stage: 'selectTeam',
    mode: 'sessions',
    startedAt: new Date(),
    status: 'reserved',
    reserveUnits: 10000,
  };
  await repo.recordRequest(entry);
  await repo.recordRequest({
    ...entry,
    status: 'completed',
    actualUnits: 125,
    inputTokens: 50,
    outputTokens: 10,
    cachedTokens: 10,
  });
  expect(await db.collection('ai_request_costs').countDocuments()).toBe(1);
  expect(await db.collection('ai_request_costs').findOne({})).toMatchObject({
    reserveUnits: 10000,
    actualUnits: 125,
    status: 'completed',
  });
});

test('private decision traces are stored separately and updated by request ID', async () => {
  const db = client.db('private-traces');
  const repo = new AiRepository(db);
  const trace = {
    _id: 'request-private',
    roomID: 'room',
    player: '7',
    stage: 'onMission',
    createdAt: new Date(),
    payload: { input: 'private facts' },
    memoryBefore: 'Suspect 4',
  };
  await repo.recordDecision(trace);
  await repo.recordDecision({ ...trace, memoryAfter: 'Decision: Fail', choice: 'fail' });
  expect(await db.collection('ai_decision_traces').countDocuments()).toBe(1);
  expect(await db.collection('ai_decision_traces').findOne({})).toMatchObject({
    memoryBefore: 'Suspect 4',
    memoryAfter: 'Decision: Fail',
    choice: 'fail',
  });
  expect(await repo.load('room')).toBeNull();
  expect(await repo.recent(10)).toEqual([]);
});

test('100 RUB match cap is persistent and does not reset the experiment ledger', async () => {
  const db = client.db('hundred');
  const repo = new AiRepository(db);
  await repo.claim('match');
  await repo.reserve('match', 1000000);
  expect(await new AiRepository(db).roomCost('match')).toBe(100);
  await expect(repo.reserve('match', 1)).rejects.toThrow();
  expect(() => new AiRepository(db, 500, 101)).toThrow();
});

test('legacy lobby and room replays recover model labels from traces without exposing project IDs', async () => {
  const db = client.db('legacy-model');
  await db.collection<{ _id: string; state: Record<string, unknown> }>('ai_room_replays').insertMany([
    { _id: 'legacy', state: { roomID: 'legacy', createAt: '2026-09-22', ai: { status: 'finished' } } },
    {
      _id: 'known',
      state: { roomID: 'known', createAt: '2026-09-21', ai: { status: 'finished', model: 'saved-model' } },
    },
  ]);
  await db.collection('ai_decision_traces').insertMany([
    { roomID: 'legacy', payload: { model: 'gpt://private-project/qwen3.6-35b-a3b' } },
    { roomID: 'legacy', payload: { model: 'gpt://private-project/qwen3.6-35b-a3b' } },
    { roomID: 'known', payload: { model: 'gpt://private-project/different-model' } },
  ]);
  const repo = new AiRepository(db);
  expect((await repo.load('legacy'))?.ai?.model).toBe('qwen3.6-35b-a3b');
  expect((await repo.recent(2)).map((state) => state.ai?.model)).toEqual(['qwen3.6-35b-a3b', 'saved-model']);
});

test('raising experiment ceiling to 700 preserves previous spending', async () => {
  const db = client.db('raised-budget');
  const old = new AiRepository(db, 500, 100);
  for (let i = 0; i < 5; i++) {
    await old.claim(`r${i}`);
    await old.reserve(`r${i}`, 1000000);
    await old.release(`r${i}`);
  }
  const raised = new AiRepository(db, 700, 100);
  for (let i = 5; i < 7; i++) {
    await raised.claim(`r${i}`);
    await raised.reserve(`r${i}`, 1000000);
    await raised.release(`r${i}`);
  }
  await raised.claim('overflow');
  await expect(raised.reserve('overflow', 1)).rejects.toThrow();
  expect(await raised.roomCost('r0')).toBe(100);
  expect(() => new AiRepository(db, 701, 100)).toThrow();
});

test('production periods retain room costs and settle a late response into its original period', async () => {
  const db = client.db('periods');
  const clock = jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-09-22T12:00:00Z'));
  try {
    const repo = new AiRepository(db, 3000, 150, { periodDays: 30, ledgerID: 'production' });
    await repo.claim('room');
    const period = await repo.reserve('room', 1000000);
    expect(await repo.budget()).toMatchObject({ limitRub: 3000, usedRub: 100, matchLimitRub: 150 });
    await expect(repo.reserve('room', 500001)).rejects.toThrow('150');
    clock.mockReturnValue(Date.parse('2026-10-22T00:00:00Z'));
    expect(await repo.budget()).toMatchObject({ usedRub: 0, remainingRub: 3000 });
    await repo.settle('room', 1000000, 900000, period);
    expect(await repo.budget()).toMatchObject({ usedRub: 0 });
    expect(await repo.roomCost('room')).toBe(90);
    const restarted = new AiRepository(db, 3000, 150, { periodDays: 30, ledgerID: 'production' });
    expect(await restarted.budget()).toEqual(await repo.budget());
  } finally {
    clock.mockRestore();
  }
});

test('concurrent production reservations enforce the period ceiling independently of lifetime totals', async () => {
  const db = client.db('period-cap');
  const repo = new AiRepository(db, 1, 1, { periodDays: 30, ledgerID: 'production' });
  await repo.claim('room');
  const results = await Promise.allSettled(Array.from({ length: 10 }, () => repo.reserve('room', 2000)));
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(5);
  await repo.release('room');
  await repo.claim('other');
  await expect(repo.reserve('other', 1)).rejects.toThrow('Лимит бюджета');
  expect(await repo.budget()).toMatchObject({ usedRub: 1, remainingRub: 0 });
});
