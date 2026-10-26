import { aiPlayedModel } from '@avalon/types';
import type { MongoMemoryServer } from 'mongodb-memory-server-core';
import { createTestMongo } from '@/test-utils/mongo';
import { MongoClient } from 'mongodb';
import { AiRepository } from './repository';
import { defaultBotQuotaThresholds } from './quota-policy';
import { MigrationManager, migrations } from '@/db/migrations';
let server: MongoMemoryServer;
let client: MongoClient;
beforeAll(async () => {
  server = await createTestMongo();
  client = await MongoClient.connect(server.getUri());
});
afterAll(async () => {
  await client?.close();
  await server?.stop();
});
test('bot quota thresholds persist across repository instances and invalid edits leave stored settings intact', async () => {
  const db = client.db('bot-quota-settings');
  const repo = new AiRepository(db);
  expect(await repo.getBotQuotaThresholds()).toEqual(defaultBotQuotaThresholds);
  const thresholds = {
    smart: { weekly: 7, shortTerm: 70 },
    regular: { weekly: 4, shortTerm: 40 },
    beginner: { weekly: 2, shortTerm: 25 },
  };
  await repo.setBotQuotaThresholds(thresholds);
  expect(await new AiRepository(db).getBotQuotaThresholds()).toEqual(thresholds);
  await expect(repo.setBotQuotaThresholds({ ...thresholds, beginner: { weekly: -1, shortTerm: 0 } })).rejects.toThrow();
  expect(await repo.getBotQuotaThresholds()).toEqual(thresholds);
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

test.each(['saved', 'migrated'])('%s AI dates select the newest games before applying the list limit', async (mode) => {
  const db = client.db(`chronological-${mode}`);
  const repo = new AiRepository(db);
  const states = Array.from({ length: 22 }, (_, index) => ({
    roomID: `older-${index}`,
    createAt: 'Wed Sep 23 2026 17:34:09 GMT+0000 (Coordinated Universal Time)',
    stage: 'started',
    leaderID: 'owner',
    players: [],
    options: { roles: {}, addons: {}, features: {} },
    ai: { status: 'finished', model: 'saved-model' },
    game: { stage: 'end', result: { winner: 'evil', reason: 'killMerlin' } },
  }));
  states.push({
    ...states[0],
    roomID: 'dddiazzz',
    createAt: 'Sat Oct 10 2026 20:02:48 GMT+0000 (Coordinated Universal Time)',
  });
  states.push({ ...states[0], roomID: 'iso-date', createAt: '2026-10-09T20:02:48.000Z' });
  if (mode === 'saved') {
    for (const state of states) await repo.save(state as unknown as import('@avalon/types').StartedRoomState);
    expect(states[22].createAt).toBe('Sat Oct 10 2026 20:02:48 GMT+0000 (Coordinated Universal Time)');
  } else {
    await db
      .collection<{ _id: string; state: (typeof states)[number] }>('ai_room_replays')
      .insertMany(states.map((state) => ({ _id: state.roomID, state })));
    const dateMigration = migrations.filter((migration) => migration.name === '2026-10-11-ai-room-dates-v1');
    await MigrationManager.runMigrations(db, dateMigration);
    await MigrationManager.runMigrations(db, dateMigration);
  }
  const restarted = new AiRepository(db);
  expect((await restarted.recent(20)).slice(0, 2).map((state) => state.roomID)).toEqual(['dddiazzz', 'iso-date']);
  expect((await restarted.recentSummaries()).slice(0, 2).map((room) => room.uuid)).toEqual(['dddiazzz', 'iso-date']);
  expect(await db.collection('ai_room_replays').countDocuments()).toBe(24);
  expect((await restarted.load('dddiazzz'))?.game.result).toEqual({ winner: 'evil', reason: 'killMerlin' });
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

test('room lease covers a request and one retry and is renewed for the next request', async () => {
  const db = client.db('long-request-lease');
  const repo = new AiRepository(db);
  await repo.claim('slow');
  const collection = db.collection<{ _id: string; leaseUntil: Date }>('ai_experiment_budget');
  const first = (await collection.findOne({ _id: 'avalon-ai-v1' }))!;
  expect(first.leaseUntil.getTime() - Date.now()).toBeGreaterThan(20 * 60 * 1000);
  // Both ten-minute attempts must leave a safety margin without new reservations.
  await collection.updateOne(
    { _id: first._id },
    { $set: { leaseUntil: new Date(first.leaseUntil.getTime() - 1200000) } },
  );
  await expect(repo.claim('other')).rejects.toThrow('Другая AI-партия');
  await repo.renewLease('slow');
  const renewed = (await collection.findOne({ _id: first._id }))!;
  expect(renewed.leaseUntil.getTime() - Date.now()).toBeGreaterThan(20 * 60 * 1000);
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

test('saved AI award work survives a failed award and repository restart', async () => {
  const db = client.db('award-retry');
  const state = {
    roomID: 'award-retry',
    stage: 'started',
    createAt: new Date().toISOString(),
    ai: { humanPlayerID: 'human', status: 'running' },
    game: { stage: 'end', result: { winner: 'good', reason: 'missions' }, players: [{ id: 'human', role: 'servant' }] },
  } as unknown as import('@avalon/types').StartedRoomState;
  await new AiRepository(db).save(state);
  const failed = async () => {
    throw new Error('temporary achievement failure');
  };
  const process = (repo: AiRepository, handler: (state: import('@avalon/types').StartedRoomState) => Promise<void>) =>
    repo.processPendingAchievements(handler);
  await expect(process(new AiRepository(db), failed)).rejects.toThrow('temporary achievement failure');
  const awarded: string[] = [];
  await process(new AiRepository(db), async (saved) => {
    awarded.push(saved.ai!.humanPlayerID!);
  });
  await process(new AiRepository(db), async (saved) => {
    awarded.push(saved.ai!.humanPlayerID!);
  });
  expect(awarded).toEqual(['human']);
});

test('independent instance leases allow one concurrent match each and scope stale-owner operations', async () => {
  const db = client.db('instance-leases');
  const repo = new AiRepository(db);
  const claim = (room: string, instance: string) =>
    (repo.claim as (room: string, instance: string) => Promise<void>)(room, instance);
  await Promise.all([claim('one', 'first'), claim('two', 'second')]);
  await expect(claim('three', 'first')).rejects.toThrow();
  await repo.renewLease('one');
  await repo.renewLease('two');
  await repo.release('one');
  await claim('three', 'first');
  await repo.release('one');
  await expect(repo.renewLease('one')).rejects.toThrow();
  await repo.renewLease('three');
  await expect(claim('four', 'second')).rejects.toThrow();
});

test('two account slots are atomic across backends and release preserves the other owner', async () => {
  const db = client.db('two-game-slots');
  const repo = new AiRepository(db);
  const peer = new AiRepository(db);
  const results = await Promise.allSettled([
    repo.claim('one', 'shared', 2),
    peer.claim('two', 'shared', 2),
    peer.claim('three', 'shared', 2),
  ]);
  expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(2);
  const busy = await peer.busyInstances();
  expect(busy).toHaveLength(2);
  expect(busy.every((lease) => lease.instanceID === 'shared')).toBe(true);
  await expect(peer.claim('overflow', 'shared', 2)).rejects.toThrow();
  await repo.release(busy[0].roomID);
  // Re-claiming the surviving room must renew its slot, never consume the freed one.
  await peer.claim(busy[1].roomID, 'shared', 2);
  expect(await repo.busyInstances()).toHaveLength(1);
  await peer.claim('replacement', 'shared', 2);
  await repo.release(busy[0].roomID);
  await expect(repo.renewLease(busy[0].roomID)).rejects.toThrow();
  await repo.renewLease(busy[1].roomID);
  await repo.renewLease('replacement');
  expect(await repo.busyInstances()).toHaveLength(2);
});

test('overlapping games retain exact token totals without double-counting shared account quota', async () => {
  const db = client.db('shared-account-accounting');
  const repo = new AiRepository(db);
  const now = Date.now();
  const before = {
    remainingPercent: 90,
    resetsAt: Math.floor(now / 1000) + 86400,
    checkedAt: now - 1000,
    shortTerm: { remainingPercent: 90, resetsAt: Math.floor(now / 1000) + 3600 },
  };
  const state = {
    ai: { status: 'running' },
    players: [],
    options: {},
  } as unknown as import('@avalon/types').StartedRoomState;
  await Promise.all(['a', 'b'].map((roomID) => repo.claim(roomID, 'shared', 2)));
  await Promise.all(['a', 'b'].map((roomID) => repo.startGameUsage({ ...state, roomID }, 'shared', before)));
  for (const roomID of ['a', 'b']) {
    await repo.recordRequest({
      _id: roomID,
      roomID,
      player: 'bot',
      stage: 'vote',
      mode: 'codex',
      startedAt: new Date(now),
      status: 'completed',
      inputTokens: 100,
      outputTokens: 20,
    });
    await repo.finishGameUsage(roomID, {
      ...before,
      remainingPercent: 80,
      checkedAt: Date.now(),
      shortTerm: { ...before.shortTerm, remainingPercent: 80 },
    });
  }
  expect(await repo.recentGameUsage()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ roomID: 'a', inputTokens: 100, weeklySpent: null, shortTermSpent: null }),
      expect.objectContaining({ roomID: 'b', inputTokens: 100, weeklySpent: null, shortTermSpent: null }),
    ]),
  );
  expect((await repo.weeklyAccountUsage([{ id: 'shared', quota: before }]))[0]).toMatchObject({
    tokens: 240,
    gameCount: 2,
    weeklySpent: null,
    weeklyIncomplete: true,
    shortTermSpent: null,
    shortTermIncomplete: true,
  });
});

test('a paused game retains shared-quota protection when a sibling starts before it resumes', async () => {
  const repo = new AiRepository(client.db('paused-shared-account'));
  const now = Date.now();
  const quota = { remainingPercent: 90, resetsAt: Math.floor(now / 1000) + 86400, checkedAt: now };
  const state = {
    ai: { status: 'running' },
    players: [],
    options: {},
  } as unknown as import('@avalon/types').StartedRoomState;
  await repo.claim('paused', 'one', 2);
  await repo.startGameUsage({ ...state, roomID: 'paused' }, 'one', quota);
  await repo.finishGameUsage('paused', { ...quota, remainingPercent: 89, checkedAt: now + 1 });
  await client
    .db('paused-shared-account')
    .collection('ai_game_usage')
    .updateOne({ roomID: 'paused' }, { $set: { status: 'paused', checkedAt: now - 1 } });
  await repo.claim('sibling', 'one', 2);
  await repo.startGameUsage({ ...state, roomID: 'sibling' }, 'one', quota);
  await repo.finishGameUsage('paused', { ...quota, remainingPercent: 80, checkedAt: now + 2 });
  expect((await repo.recentGameUsage()).find((game) => game.roomID === 'paused')!.weeklySpent).toBeNull();
});

test('an abandoned usage record without a live lease cannot contaminate later game quota', async () => {
  const repo = new AiRepository(client.db('abandoned-shared-account'));
  const quota = { remainingPercent: 90, resetsAt: Math.floor(Date.now() / 1000) + 86400, checkedAt: Date.now() };
  const state = {
    ai: { status: 'running' },
    players: [],
    options: {},
  } as unknown as import('@avalon/types').StartedRoomState;
  await repo.startGameUsage({ ...state, roomID: 'abandoned' }, 'one', quota);
  await repo.claim('new-room', 'one', 2);
  await repo.startGameUsage({ ...state, roomID: 'new-room' }, 'one', quota);
  await repo.finishGameUsage('new-room', { ...quota, remainingPercent: 89, checkedAt: Date.now() });
  expect((await repo.recentGameUsage()).find((game) => game.roomID === 'new-room')!.weeklySpent).toBe(1);
});

test('per-game usage survives restart, aggregates retried audits once and keeps account snapshots isolated', async () => {
  const db = client.db('game-usage');
  const repo = new AiRepository(db);
  const state = {
    roomID: 'usage-room',
    stage: 'started',
    createAt: new Date().toISOString(),
    ai: { status: 'running', humanPlayerIDs: ['human', 'friend'], botDifficulty: 'regular', language: 'ru' },
    players: Array.from({ length: 5 }, (_, id) => ({ id: String(id) })),
    options: { roles: { merlin: 1 }, addons: {} },
    game: { stage: 'votingForTeam' },
  } as unknown as import('@avalon/types').StartedRoomState;
  const before = {
    remainingPercent: 80,
    resetsAt: 2000000000,
    checkedAt: 1,
    shortTerm: { remainingPercent: 90, resetsAt: 1900000000 },
  };
  await repo.startGameUsage(state, 'one', before);
  // Resuming cannot overwrite the initial balance or participant counts.
  await repo.startGameUsage({ ...state, players: [] }, 'two', { ...before, remainingPercent: 70 });
  const audit = {
    _id: 'request-one',
    roomID: state.roomID,
    player: 'bot',
    stage: 'vote',
    mode: 'codex',
    startedAt: new Date(),
    finishedAt: new Date(),
    status: 'completed',
    inputTokens: 100,
    cachedTokens: 40,
    outputTokens: 20,
    reasoningTokens: 10,
    model: 'model-one',
    reasoning: 'low',
  };
  await repo.recordRequest(audit);
  await repo.recordRequest(audit);
  await repo.recordRequest({
    ...audit,
    _id: 'request-two',
    inputTokens: 50,
    cachedTokens: 0,
    outputTokens: 5,
    reasoningTokens: 0,
    status: 'failed',
    unknownUsageAttempts: 1,
  });
  await repo.recordRequest({ ...audit, _id: 'unrelated', roomID: 'other', inputTokens: 9999 });
  await repo.recordRequest({ ...audit, _id: 'review-on-another-account', phase: 'beginner-review', inputTokens: 9999 });
  state.ai!.status = 'paused';
  await repo.save(state);
  await repo.finishGameUsage(state.roomID, {
    ...before,
    remainingPercent: 78,
    shortTerm: { ...before.shortTerm, remainingPercent: 83 },
  });
  const [usage] = await new AiRepository(db).recentGameUsage();
  expect(usage).toMatchObject({
    roomID: 'usage-room',
    instanceID: 'one',
    humanCount: 2,
    botCount: 3,
    status: 'paused',
    mode: 'regular',
    language: 'ru',
    options: state.options,
    inputTokens: 150,
    cachedTokens: 40,
    outputTokens: 25,
    reasoningTokens: 10,
    requests: 2,
    unknownUsageRequests: 1,
    weeklySpent: 2,
    shortTermSpent: 7,
    settings: [{ model: 'model-one', reasoning: 'low' }],
  });
  expect(usage).not.toHaveProperty('before');
  expect(usage).not.toHaveProperty('_id');
  await repo.finishGameUsage(state.roomID, { ...before, resetsAt: 2100000000, remainingPercent: 99, shortTerm: null });
  expect((await repo.recentGameUsage())[0]).toMatchObject({ weeklySpent: null, shortTermSpent: null });
  await db.collection('ai_game_usage').updateOne({ roomID: state.roomID }, { $set: { expiresAt: new Date(0) } });
  expect(await repo.recentGameUsage()).toEqual([]);
});

test('account totals follow each weekly reset, include more than 50 games and split games at request boundaries', async () => {
  const db = client.db('weekly-account-usage');
  const repo = new AiRepository(db);
  const now = Date.now();
  const week = 7 * 86400;
  const reset = Math.floor(now / 1000) + 86400;
  const start = (reset - week) * 1000;
  const quota = { remainingPercent: 80, resetsAt: reset, checkedAt: start, shortTerm: null };
  const state = {
    roomID: 'crossing',
    ai: { status: 'running' },
    players: [],
    options: {},
  } as unknown as import('@avalon/types').StartedRoomState;
  for (let i = 0; i < 52; i++) {
    await repo.startGameUsage({ ...state, roomID: `week-${i}` }, 'one', quota);
    await repo.recordRequest({
      _id: `request-${i}`,
      roomID: `week-${i}`,
      player: 'bot',
      stage: 'vote',
      mode: 'codex',
      startedAt: new Date(start + 1000),
      status: 'completed',
      inputTokens: 10,
      outputTokens: 2,
    });
  }
  await repo.startGameUsage(state, 'one', { ...quota, resetsAt: reset - week, checkedAt: start - 1 });
  const audit = {
    player: 'bot',
    stage: 'vote',
    mode: 'codex',
    status: 'completed',
    inputTokens: 100,
    outputTokens: 20,
  };
  await repo.recordRequest({ ...audit, _id: 'old', roomID: 'crossing', startedAt: new Date(start - 1) });
  await repo.recordRequest({ ...audit, _id: 'new', roomID: 'crossing', startedAt: new Date(start) });
  await repo.recordRequest({
    ...audit,
    _id: 'review',
    roomID: 'crossing',
    startedAt: new Date(start),
    phase: 'beginner-review',
  });
  await repo.recordRequest({
    ...audit,
    _id: 'unknown',
    roomID: 'crossing',
    startedAt: new Date(start),
    inputTokens: undefined,
    outputTokens: undefined,
  });
  await repo.startGameUsage({ ...state, roomID: 'other-account' }, 'two', {
    ...quota,
    resetsAt: reset + 3600,
    checkedAt: start + 3600000,
  });
  await repo.recordRequest({ ...audit, _id: 'other', roomID: 'other-account', startedAt: new Date(start + 1000) });
  const summaries = await new AiRepository(db).weeklyAccountUsage(
    [
      { id: 'one', quota: { ...quota, checkedAt: now } },
      { id: 'two', quota: { ...quota, resetsAt: reset + 3600, checkedAt: now } },
      { id: 'offline', quota: null },
    ],
    now,
  );
  expect(summaries[0]).toMatchObject({ instanceID: 'one', tokens: 744, gameCount: 53 });
  expect(summaries[1]).toMatchObject({ instanceID: 'two', tokens: 0, gameCount: 0 });
  expect(summaries[2]).toMatchObject({ instanceID: 'offline', tokens: null });
  // The clock alone is not proof of a reset: wait for an observed new deadline.
  expect((await repo.weeklyAccountUsage([{ id: 'one', quota }], reset * 1000))[0]).toMatchObject({
    tokens: 744,
    gameCount: 53,
  });
  expect(
    (
      await repo.weeklyAccountUsage(
        [{ id: 'one', quota: { ...quota, resetsAt: reset + week, checkedAt: reset * 1000 } }],
        reset * 1000,
      )
    )[0],
  ).toMatchObject({ tokens: 0, gameCount: 0 });
  await repo.recordRequest({ ...audit, _id: 'next-week', roomID: 'crossing', startedAt: new Date(reset * 1000) });
  expect((await repo.weeklyAccountUsage([{ id: 'one', quota }], reset * 1000))[0]).toMatchObject({
    tokens: 120,
    gameCount: 1,
  });
  expect(
    (
      await repo.weeklyAccountUsage(
        [{ id: 'one', quota: { ...quota, resetsAt: reset + week, checkedAt: reset * 1000 } }],
        reset * 1000,
      )
    )[0],
  ).toMatchObject({ tokens: 120, gameCount: 1 });
  expect((await repo.recentGameUsage()).length).toBe(50);
});

test('an observed early reset clears account totals and survives restarts, missing metadata and stale readers', async () => {
  const db = client.db('early-weekly-reset');
  const repo = new AiRepository(db);
  const now = Date.now();
  const quota = { remainingPercent: 40, resetsAt: Math.floor(now / 1000) + 86400, checkedAt: now - 10000 };
  const state = {
    roomID: 'ongoing',
    ai: { status: 'running' },
    players: [],
    options: {},
  } as unknown as import('@avalon/types').StartedRoomState;
  await repo.startGameUsage(state, 'one', quota);
  const audit = {
    roomID: state.roomID,
    player: 'bot',
    stage: 'vote',
    mode: 'codex',
    status: 'completed',
    inputTokens: 100,
    outputTokens: 20,
  };
  await repo.recordRequest({ ...audit, _id: 'before-reset', startedAt: new Date(now - 9000) });
  expect((await repo.weeklyAccountUsage([{ id: 'one', quota }], now))[0].tokens).toBe(120);
  // The new deadline is still less than seven days away: subtracting a week would retain old usage.
  const reset = { ...quota, resetsAt: quota.resetsAt + 3600, checkedAt: now };
  expect((await repo.weeklyAccountUsage([{ id: 'one', quota: reset }], now))[0]).toMatchObject({
    tokens: 0,
    gameCount: 0,
  });
  await repo.recordRequest({ ...audit, _id: 'after-reset', startedAt: new Date(now + 1) });
  const restarted = new AiRepository(db);
  expect((await restarted.weeklyAccountUsage([{ id: 'one', quota: reset }], now + 2))[0].tokens).toBe(120);
  expect((await restarted.weeklyAccountUsage([{ id: 'one', quota: null }], now + 2))[0].tokens).toBe(120);
  await Promise.all([
    repo.weeklyAccountUsage([{ id: 'one', quota }], now + 2),
    restarted.weeklyAccountUsage([{ id: 'one', quota: { ...reset, checkedAt: now + 2 } }], now + 2),
  ]);
  expect((await new AiRepository(db).weeklyAccountUsage([{ id: 'one', quota }], now + 3))[0].tokens).toBe(120);
  const anotherReset = { ...reset, resetsAt: reset.resetsAt + 7200, checkedAt: now + 4 };
  await repo.finishGameUsage(state.roomID, anotherReset);
  expect((await restarted.weeklyAccountUsage([{ id: 'one', quota: null }], now + 4))[0].tokens).toBe(0);
  // Existing stored game snapshots also seed a first-run period without guessing a week boundary.
  await db.collection<{ _id: string }>('ai_account_usage_periods').deleteOne({ _id: 'one' });
  expect((await new AiRepository(db).weeklyAccountUsage([{ id: 'one', quota: anotherReset }], now + 4))[0].tokens).toBe(
    0,
  );
  expect((await repo.recentGameUsage())[0].inputTokens).toBe(200);
});
