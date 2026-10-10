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
test('only one concurrent room owns the Codex lease and stale owners cannot renew or release it', async () => {
  const db = client.db('codex-exclusive');
  const repo = new AiRepository(db);
  const attempts = await Promise.allSettled(['one', 'two'].map((id) => repo.claim(id)));
  expect(attempts.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  const winner = attempts[0].status === 'fulfilled' ? 'one' : 'two';
  const loser = winner === 'one' ? 'two' : 'one';
  await expect(repo.renewLease(loser)).rejects.toThrow();
  await repo.release(loser);
  await expect(repo.claim(loser)).rejects.toThrow();
  await repo.release(winner);
  await new AiRepository(db).claim(loser);
  await expect(repo.renewLease(winner)).rejects.toThrow();
});

test('Codex lease upgrades preserve historical accounting and take over only after expiry', async () => {
  const db = client.db('codex-upgrade');
  const ledger = db.collection<{ _id: string; owner: string; leaseUntil: Date; used: number; rooms: object }>(
    'ai_experiment_budget',
  );
  await ledger.insertOne({
    _id: 'avalon-ai-v1',
    owner: 'old',
    leaseUntil: new Date(Date.now() + 60000),
    used: 42000,
    rooms: { historical: 42000 },
  });
  const repo = new AiRepository(db);
  await expect(repo.claim('new')).rejects.toThrow();
  await ledger.updateOne({ _id: 'avalon-ai-v1' }, { $set: { leaseUntil: new Date(0) } });
  await repo.claim('new');
  await repo.renewLease('new');
  expect(await ledger.findOne({ _id: 'avalon-ai-v1' })).toMatchObject({
    owner: 'new',
    used: 42000,
    rooms: { historical: 42000 },
  });
  await repo.release('new');
  await expect(repo.renewLease('new')).rejects.toThrow();
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

test('AI room summaries preserve selected language and default older archives to English', async () => {
  const db = client.db('summary-languages');
  await db.collection<{ _id: string; state: Record<string, unknown> }>('ai_room_replays').insertMany(
    [undefined, 'ru', 'zh-tw'].map((language, index) => ({
      _id: `language-${index}`,
      state: {
        roomID: `language-${index}`,
        createAt: `2026-09-${20 + index}T12:00:00.000Z`,
        stage: 'locked',
        leaderID: 'owner',
        players: [],
        options: { roles: {}, addons: {}, features: {} },
        ai: { status: 'finished', model: 'saved-model', ...(language ? { language } : {}) },
      },
    })),
  );
  expect(await new AiRepository(db).recentSummaries()).toMatchObject([
    { uuid: 'language-2', aiLanguage: 'zh-tw' },
    { uuid: 'language-1', aiLanguage: 'ru' },
    { uuid: 'language-0', aiLanguage: 'en' },
  ]);
});

test('lobby summaries skip stopped archives before limiting without deleting their replays', async () => {
  const db = client.db('summary-stopped');
  const collection = db.collection<{ _id: string; state: Record<string, unknown> }>('ai_room_replays');
  const statuses = [...Array.from({ length: 21 }, () => 'stopped'), 'running', 'paused', 'finished', 'finished'];
  await collection.insertMany(
    statuses.map((status, index) => ({
      _id: `room-${index}`,
      state: {
        roomID: `room-${index}`,
        createAt: new Date(Date.UTC(2026, 9, 30 - index)).toISOString(),
        stage: 'started',
        leaderID: 'owner',
        players: [],
        options: { roles: {}, addons: {}, features: {} },
        ai: { status, model: 'saved-model' },
      },
    })),
  );
  const repo = new AiRepository(db);
  expect((await repo.recentSummaries()).map(({ uuid }) => uuid)).toEqual(['room-23', 'room-24']);
  expect((await repo.load('room-0'))?.ai?.status).toBe('stopped');
  expect((await repo.load('room-21'))?.ai?.status).toBe('stopped');
  expect(await repo.recent(30)).toHaveLength(25);
  expect(await collection.countDocuments()).toBe(25);
});

test('Codex request log records finalized subscription token usage once', async () => {
  const db = client.db('request-costs');
  const repo = new AiRepository(db);
  const entry = {
    _id: 'request-1',
    roomID: 'match',
    player: '3',
    stage: 'selectTeam',
    mode: 'codex-chatgpt',
    startedAt: new Date(),
    status: 'sent',
  };
  await repo.recordRequest(entry);
  await repo.recordRequest({
    ...entry,
    status: 'completed',
    finishedAt: new Date(),
    inputTokens: 50,
    outputTokens: 10,
    cachedTokens: 10,
  });
  expect(await db.collection('ai_request_costs').countDocuments()).toBe(1);
  expect(await db.collection('ai_request_costs').findOne({})).toMatchObject({
    inputTokens: 50,
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
    { roomID: 'legacy', payload: { model: 'gpt://private-project/legacy-model' } },
    { roomID: 'legacy', payload: { model: 'gpt://private-project/legacy-model' } },
    { roomID: 'known', payload: { model: 'gpt://private-project/different-model' } },
  ]);
  const repo = new AiRepository(db);
  expect((await repo.load('legacy'))?.ai?.model).toBe('legacy-model');
  expect((await repo.recent(2)).map((state) => state.ai?.model)).toEqual(['legacy-model', 'saved-model']);
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
  await repo.renewLease('slow');
  const renewed = (await collection.findOne({ _id: first._id }))!;
  expect(renewed.leaseUntil.getTime() - Date.now()).toBeGreaterThan(10 * 60 * 1000);
  await repo.release('slow');
  await expect(repo.claim('other')).resolves.toBeUndefined();
});

test('diagnostic retention expires finalized Codex logs and retains in-flight requests', async () => {
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
      mode: 'codex-chatgpt',
      status: 'completed',
      startedAt,
      finishedAt: startedAt,
    });
    await repo.recordRequest({
      _id: 'unknown',
      roomID: 'room',
      player: '1',
      stage: 'vote',
      mode: 'codex-chatgpt',
      status: 'sent',
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
