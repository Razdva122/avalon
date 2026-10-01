import { aiPlayedModel } from '@avalon/types';
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

test('doubling one match cap persists, preserves spending and cannot bypass the shared budget', async () => {
  const db = client.db('resume-budget');
  const repo = new AiRepository(db, 3, 1);
  await repo.claim('match');
  await repo.reserve('match', 9000);
  await expect(repo.reserve('match', 2000)).rejects.toMatchObject({ reserveUnits: 2000 });
  expect(await repo.doubleMatchLimit('match', 2000)).toBe(2);
  const restarted = new AiRepository(db, 3, 1);
  expect(await restarted.roomLimit('match')).toBe(2);
  expect(await restarted.roomLimit('other')).toBe(1);
  expect(await restarted.roomCost('match')).toBe(0.9);
  await restarted.reserve('match', 11000);
  expect(await restarted.doubleMatchLimit('match', 5000)).toBe(4);
  await restarted.reserve('match', 10000);
  await expect(restarted.reserve('match', 1)).rejects.toThrow('Лимит бюджета');
  await expect(restarted.doubleMatchLimit('match', 1)).rejects.toThrow('Лимит бюджета');
  expect(await restarted.roomLimit('match')).toBe(4);
  expect((await restarted.budget()).usedRub).toBe(3);
});

test('room lease covers a ten-minute request and is renewed for the next request', async () => {
  const db = client.db('long-request-lease');
  const repo = new AiRepository(db);
  await repo.claim('slow');
  const collection = db.collection<{ _id: string; leaseUntil: Date }>('ai_experiment_budget');
  const first = (await collection.findOne({ _id: 'avalon-ai-v1' }))!;
  expect(first.leaseUntil.getTime() - Date.now()).toBeGreaterThan(10 * 60 * 1000);
  // A ten-minute wait must leave a safety margin, even with no new reservations.
  await collection.updateOne(
    { _id: first._id },
    { $set: { leaseUntil: new Date(first.leaseUntil.getTime() - 600000) } },
  );
  await expect(repo.claim('other')).rejects.toThrow('Другая AI-партия');
  await repo.reserve('slow', 1000);
  const renewed = (await collection.findOne({ _id: first._id }))!;
  expect(renewed.leaseUntil.getTime() - Date.now()).toBeGreaterThan(10 * 60 * 1000);
  await repo.release('slow');
  await expect(repo.claim('other')).resolves.toBeUndefined();
});

test('production match starts at 200 and admin extension reaches 400 without resetting cost', async () => {
  const db = client.db('production-200');
  const repo = new AiRepository(db, 3000, 200, { periodDays: 30, ledgerID: 'production' });
  await repo.claim('match');
  expect(await repo.roomLimit('match')).toBe(200);
  await repo.reserve('match', 1990000);
  await expect(repo.reserve('match', 20000)).rejects.toThrow('Лимит партии 200');
  expect(await repo.doubleMatchLimit('match', 20000)).toBe(400);
  await repo.reserve('match', 20000);
  expect(await repo.roomCost('match')).toBe(201);
  expect(await repo.budget()).toMatchObject({ limitRub: 3000, matchLimitRub: 200, usedRub: 201 });
  await expect(repo.reserve('match', 2000000)).rejects.toThrow('Лимит партии 400');
});

test('new rooms archive old costs without growing the shared budget document or resetting spending', async () => {
  const db = client.db('bounded-ledger');
  const repo = new AiRepository(db, 1, 1);
  for (let i = 0; i < 12; i++) {
    await repo.claim(`room-${i}`);
    await repo.reserve(`room-${i}`, 100);
    await repo.release(`room-${i}`);
  }
  const ledger = await db.collection('ai_experiment_budget').findOne({});
  expect(Object.keys(ledger!.rooms).length).toBeLessThanOrEqual(1);
  expect(await repo.roomCost('room-0')).toBe(0.01);
  expect((await repo.budget()).usedRub).toBe(0.12);
  await expect(repo.claim('room-0')).rejects.toThrow();
});

test('identified settlements apply only once and never refund a different reservation', async () => {
  const db = client.db('idempotent-ai-settlement');
  const repo = new AiRepository(db, 1, 1);
  const reserve = repo.reserve.bind(repo) as (
    room: string,
    units: number,
    request: string,
  ) => Promise<string | undefined>;
  const settle = repo.settle.bind(repo) as (
    room: string,
    reserved: number,
    actual: number,
    period: string | undefined,
    request: string,
  ) => Promise<void>;
  await repo.claim('room');
  const period = await reserve('room', 1000, 'request');
  await Promise.all([settle('room', 1000, 100, period, 'request'), settle('room', 1000, 100, period, 'request')]);
  expect(await repo.roomCost('room')).toBe(0.01);
  await expect(settle('room', 2000, 0, period, 'request')).rejects.toThrow();
  expect(await repo.roomCost('room')).toBe(0.01);
});

test('restarting refunds abandoned unsent reservations but preserves possibly billed requests', async () => {
  const db = client.db('recover-ai-reservations');
  const repo = new AiRepository(db, 1, 1);
  await repo.claim('old');
  await repo.reserve('old', 1000, 'unsent');
  await repo.reserve('old', 2000, 'sent');
  await repo.markDispatched('old', 'sent');
  await db.collection('ai_experiment_budget').updateOne({}, { $set: { leaseUntil: new Date(0) } });
  await new AiRepository(db, 1, 1).claim('new');
  expect(await repo.roomCost('old')).toBe(0.2);
  expect((await repo.budget()).usedRub).toBe(0.2);
  await expect(repo.settle('old', 2000, 10, undefined, 'sent')).rejects.toThrow();
  expect((await repo.budget()).usedRub).toBe(0.2);
});

test('diagnostic retention expires payloads and completed request logs without expiring billing', async () => {
  const db = client.db('ai-retention');
  const previous = { traces: process.env.AI_TRACE_RETENTION_DAYS, costs: process.env.AI_REQUEST_RETENTION_DAYS };
  process.env.AI_TRACE_RETENTION_DAYS = '7';
  process.env.AI_REQUEST_RETENTION_DAYS = '30';
  try {
    const repo = new AiRepository(db);
    const startedAt = new Date('2026-01-01T00:00:00Z');
    await repo.recordDecision({
      _id: 'trace',
      roomID: 'room',
      player: '1',
      stage: 'vote',
      createdAt: startedAt,
      payload: {},
    });
    await repo.recordRequest({
      _id: 'done',
      roomID: 'room',
      player: '1',
      stage: 'vote',
      mode: 'snapshot',
      status: 'completed',
      startedAt,
      actualUnits: 10,
    });
    await repo.recordRequest({
      _id: 'unknown',
      roomID: 'room',
      player: '1',
      stage: 'vote',
      mode: 'snapshot',
      status: 'unconfirmed-charge',
      startedAt,
    });
    expect((await db.collection('ai_decision_traces').findOne({}))?.expiresAt).toEqual(
      new Date('2026-01-08T00:00:00Z'),
    );
    expect((await db.collection('ai_request_costs').findOne({ _id: 'done' as never }))?.expiresAt).toEqual(
      new Date('2026-01-31T00:00:00Z'),
    );
    expect((await db.collection('ai_request_costs').findOne({ _id: 'unknown' as never }))?.expiresAt).toBeUndefined();
    expect((await db.collection('ai_decision_traces').indexes()).some((index) => index.expireAfterSeconds === 0)).toBe(
      true,
    );
  } finally {
    if (previous.traces === undefined) delete process.env.AI_TRACE_RETENTION_DAYS;
    else process.env.AI_TRACE_RETENTION_DAYS = previous.traces;
    if (previous.costs === undefined) delete process.env.AI_REQUEST_RETENTION_DAYS;
    else process.env.AI_REQUEST_RETENTION_DAYS = previous.costs;
  }
});

test('failed archival preserves counters and a retry preserves extended room limits', async () => {
  const db = client.db('ai-archive-retry');
  const repo = new AiRepository(db, 3, 1);
  await repo.claim('old');
  await repo.reserve('old', 1000, 'request');
  await repo.settle('old', 1000, 100, undefined, 'request');
  await repo.doubleMatchLimit('old', 100);
  await repo.release('old');
  const collection = db.collection.bind(db);
  const history = db.collection('ai_room_budgets');
  const fail = jest.spyOn(history, 'bulkWrite').mockRejectedValueOnce(Error('temporary write failure'));
  const route = jest
    .spyOn(db, 'collection')
    .mockImplementation(((name: string) =>
      name === 'ai_room_budgets' ? history : collection(name)) as typeof db.collection);
  try {
    await expect(repo.claim('new')).rejects.toThrow('temporary write failure');
    await expect(repo.claim('old')).rejects.toThrow();
    expect(await repo.roomCost('old')).toBe(0.01);
    await repo.claim('new');
    expect(await repo.roomCost('old')).toBe(0.01);
    expect(await repo.roomLimit('old')).toBe(2);
    expect((await repo.budget()).usedRub).toBe(0.01);
  } finally {
    fail.mockRestore();
    route.mockRestore();
  }
});

test('duplicate request IDs cannot add a second charge', async () => {
  const repo = new AiRepository(client.db('ai-duplicate-reserve'), 1, 1);
  await repo.claim('room');
  const attempts = await Promise.allSettled([
    repo.reserve('room', 1000, 'request'),
    repo.reserve('room', 1000, 'request'),
  ]);
  expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1);
  expect(await repo.roomCost('room')).toBe(0.1);
});

test('period archival bounds the ledger while retaining an outstanding request period for late settlement', async () => {
  const db = client.db('ai-period-archive');
  const repo = new AiRepository(db, 3000, 200, { periodDays: 30, ledgerID: 'production' });
  await repo.claim('room');
  const current = Date.parse((await repo.budget()).periodStart!);
  const oldest = String(current - 40 * 30 * 86400000);
  const periods = Object.fromEntries(Array.from({ length: 41 }, (_, i) => [String(current - i * 30 * 86400000), 1000]));
  await db.collection('ai_experiment_budget').updateOne(
    {},
    {
      $set: {
        periods,
        used: 41000,
        rooms: { room: 1000 },
        requests: { request: { roomID: 'room', units: 1000, period: oldest, dispatched: true } },
      },
    },
  );
  await repo.claim('room');
  const ledger = await db.collection('ai_experiment_budget').findOne({});
  expect(Object.keys(ledger!.periods)).toHaveLength(25);
  expect(ledger!.periods[oldest]).toBe(1000);
  expect(await db.collection('ai_budget_periods').countDocuments()).toBe(16);
  await repo.settle('room', 1000, 100, oldest, 'request');
  expect(await repo.roomCost('room')).toBe(0.01);
  expect((await repo.budget()).usedRub).toBe(0.1);
  await repo.release('room');
  await repo.claim('new');
  expect(Object.keys((await db.collection('ai_experiment_budget').findOne({}))!.periods)).toHaveLength(24);
  expect((await db.collection('ai_budget_periods').findOne({ _id: `production:${oldest}` as never }))?.units).toBe(100);
});

test('expired maintenance cannot resurrect a room while its retirement archive is in flight', async () => {
  const db = client.db('ai-retirement-fencing');
  const repo = new AiRepository(db, 3, 1);
  await repo.claim('old');
  await repo.reserve('old', 1000, 'request');
  await repo.markDispatched('old', 'request');
  await repo.settle('old', 1000, 100, undefined, 'request');
  await repo.release('old');
  const collection = db.collection.bind(db);
  const history = db.collection('ai_room_budgets');
  const bulkWrite = history.bulkWrite.bind(history);
  let entered!: () => void;
  const paused = new Promise<void>((resolve) => {
    entered = resolve;
  });
  let resume!: () => void;
  const gate = new Promise<void>((resolve) => {
    resume = resolve;
  });
  const delay = jest.spyOn(history, 'bulkWrite').mockImplementationOnce(async (...args) => {
    entered();
    await gate;
    return bulkWrite(...args);
  });
  const route = jest
    .spyOn(db, 'collection')
    .mockImplementation(((name: string) =>
      name === 'ai_room_budgets' ? history : collection(name)) as typeof db.collection);
  const retirement = repo.claim('new');
  try {
    await paused;
    await collection('ai_experiment_budget').updateOne({}, { $set: { leaseUntil: new Date(0) } });
    await expect(new AiRepository(db, 3, 1).claim('old')).rejects.toThrow();
  } finally {
    resume();
    await retirement;
    delay.mockRestore();
    route.mockRestore();
  }
  expect(await repo.roomCost('old')).toBe(0.01);
});

test('subscription lease renewal preserves RUB totals and fails after ownership is released', async () => {
  const repo = new AiRepository(client.db('codex-lease'), 1, 1);
  await repo.claim('codex-match');
  const before = await repo.budget();
  await repo.renewLease('codex-match');
  expect((await repo.budget()).usedRub).toBe(before.usedRub);
  await expect(repo.renewLease('other-match')).rejects.toThrow();
  await repo.release('codex-match');
  await expect(repo.renewLease('codex-match')).rejects.toThrow();
});

test('AI profile history counts completed games only, paginates chronologically and exposes summaries only', async () => {
  const db = client.db('profile-history');
  const repo = new AiRepository(db);
  const docs = Array.from({ length: 202 }, (_, i) => ({
    _id: `game-${String(i).padStart(3, '0')}`,
    state: {
      createAt: String(new Date(Date.UTC(2026, 8, 1, 0, i))),
      stage: 'started',
      ai: { status: 'finished' },
      players: [{ id: 'avalon-agent-3' }],
      game: {
        uuid: `game-${i}`,
        stage: 'end',
        players: [{ id: 'avalon-agent-3', role: i % 2 ? 'merlin' : 'morgana', secret: 'private' }],
        result: { winner: 'good', reason: 'missions' },
        history: ['private'],
      },
    },
  }));
  await db.collection<{ _id: string; state: Record<string, unknown> }>('ai_room_replays').insertMany([
    ...docs,
    { ...docs[0], _id: 'paused', state: { ...docs[0].state, game: { ...docs[0].state.game, stage: 'selectTeam' } } },
    {
      ...docs[0],
      _id: 'manual',
      state: { ...docs[0].state, game: { ...docs[0].state.game, result: { winner: 'good', reason: 'manualy' } } },
    },
  ]);
  const first = await repo.getPlayerGameSummariesPage('avalon-agent-3');
  expect(first.games).toHaveLength(200);
  expect(first.games[0]).toEqual({
    uuid: 'game-0',
    startAt: docs[0].state.createAt,
    players: [{ id: 'avalon-agent-3', role: 'morgana' }],
    result: { winner: 'good' },
  });
  expect(first.nextCursor).toBeDefined();
  const next = await new AiRepository(db).getPlayerGameSummariesPage('avalon-agent-3', first.nextCursor);
  expect(next.games.map((game) => game.uuid)).toEqual(['game-200', 'game-201']);
  expect(next.nextCursor).toBeUndefined();
  expect(await repo.getPlayerGameSummariesPage('avalon-agent-9')).toEqual({ games: [] });
  await expect(repo.getPlayerGameSummariesPage('avalon-agent-3', 'bad')).rejects.toThrow();
  expect(await db.collection('rooms').countDocuments()).toBe(0);
});

test('AI profile TrueSkill counts completed games from the current season, stays isolated and refreshes after save', async () => {
  const db = client.db('ai-ratings');
  const repo = new AiRepository(db);
  const state = {
    roomID: 'rating-game',
    stage: 'started',
    createAt: String(new Date('2026-10-01T00:00:00Z')),
    ai: { status: 'finished', profileRatingSeason: 1 },
    players: [{ id: 'avalon-agent-1' }],
    game: {
      uuid: 'rating-game',
      stage: 'end',
      players: [
        { id: 'avalon-agent-1', role: 'merlin' },
        { id: 'avalon-agent-2', role: 'servant' },
        { id: 'avalon-agent-3', role: 'morgana' },
      ],
      result: { winner: 'good', reason: 'missions' },
    },
  };
  expect(await repo.getProfileRating('avalon-agent-1')).toMatchObject({ mu: 6000, gamesCount: 0 });
  await repo.save(state as unknown as import('@avalon/types').StartedRoomState);
  const rating = await repo.getProfileRating('avalon-agent-1');
  expect(rating).toMatchObject({ gamesCount: 1, wins: 1, losses: 0 });
  expect(rating!.mu).toBeGreaterThan(6000);
  expect(await new AiRepository(db).getProfileRating('avalon-agent-1')).toEqual(rating);
  await repo.save(state as unknown as import('@avalon/types').StartedRoomState);
  expect(await repo.getProfileRating('avalon-agent-1')).toEqual(rating);
  expect(await db.listCollections().toArray()).toHaveLength(1);
});

test('old Codex archives infer the played model from traces and preserve the provider', async () => {
  const db = client.db('legacy-codex-model');
  await db.collection<{ _id: string; state: Record<string, unknown> }>('ai_room_replays').insertOne({
    _id: 'old-codex',
    state: { roomID: 'old-codex', createAt: '2026-10-01', ai: { status: 'finished', model: 'codex-chatgpt' } },
  });
  await db.collection('ai_decision_traces').insertOne({ roomID: 'old-codex', payload: { model: 'gpt-6.1-sol' } });
  const state = await new AiRepository(db).load('old-codex');
  expect(state?.ai?.model).toBe('codex-chatgpt');
  expect(aiPlayedModel(state?.ai)).toBe('gpt-6.1-sol');
});

test('pre-release games remain in statistics but do not affect the new 6000 rating baseline', async () => {
  const db = client.db('rating-release-boundary');
  await db.collection<{ _id: string; state: Record<string, unknown> }>('ai_room_replays').insertOne({
    _id: 'before-release',
    state: {
      createAt: String(new Date()),
      stage: 'started',
      ai: { status: 'finished' },
      players: [{ id: 'avalon-agent-1' }],
      game: {
        uuid: 'before-release',
        stage: 'end',
        players: [
          { id: 'avalon-agent-1', role: 'merlin' },
          { id: 'avalon-agent-2', role: 'servant' },
          { id: 'avalon-agent-3', role: 'morgana' },
        ],
        result: { winner: 'good', reason: 'missions' },
      },
    },
  });
  const repo = new AiRepository(db);
  expect(await repo.getProfileRating('avalon-agent-1')).toMatchObject({ mu: 6000, gamesCount: 0 });
  expect(await repo.getProfileRating('avalon-ai-1')).toBeUndefined();
  expect((await repo.getPlayerGameSummariesPage('avalon-agent-1')).games).toHaveLength(1);
});
