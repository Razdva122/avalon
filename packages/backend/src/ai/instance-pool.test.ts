/* eslint-disable @typescript-eslint/no-explicit-any */
import { mkdtemp, readFile, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { MongoClient, type Db } from 'mongodb';
import type { MongoMemoryServer } from 'mongodb-memory-server-core';
import { createTestMongo } from '@/test-utils/mongo';
import type { Manager } from '@/main';
import type { Server, ServerSocket } from '@avalon/types';
import { AiService } from './service';
import { AiRepository } from './repository';
import { BotRoom } from './room';
import { codexEnvironment } from './codex-instances';
import * as limits from './codex-limits';
import * as catalog from './codex-models';
import * as support from '@/support/repository';

const environment = { ...process.env };
let mongo: MongoMemoryServer;
let client: MongoClient;
const services: { host: Manager; connect: (user: string) => Record<string, (...args: any[]) => Promise<void>> }[] = [];
let database = 0;
beforeAll(async () => {
  mongo = await createTestMongo();
  client = await MongoClient.connect(mongo.getUri());
});
afterAll(async () => {
  await client?.close();
  await mongo?.stop();
});
beforeEach(() => {
  jest.spyOn(support, 'supportTotalCents').mockResolvedValue(0);
  process.env.NODE_ENV = 'development';
  process.env.AI_CODEX_ENABLED = 'true';
  process.env.AI_ROOMS_ENABLED = 'true';
  process.env.AI_CODEX_INSTANCES = JSON.stringify([
    { id: 'one', home: '/pool/one' },
    { id: 'two', home: '/pool/two' },
  ]);
  jest.spyOn(limits, 'getCodexWeeklyLimit').mockImplementation(async () => ({
    remainingPercent: 80,
    resetsAt: null,
    checkedAt: Date.now(),
    shortTerm: { remainingPercent: codexEnvironment().AI_CODEX_HOME === '/pool/one' ? 90 : 70, resetsAt: null },
  }));
  jest.spyOn(catalog, 'getCodexModels').mockResolvedValue([
    { id: 'gpt-6.1-sol', label: 'Sol', efforts: ['low', 'medium'] },
    { id: 'gpt-6-luna', label: 'Luna', efforts: ['low', 'medium'] },
    { id: 'gpt-6.1-terra', label: 'Terra', efforts: ['low', 'medium'] },
  ]);
});
afterEach(async () => {
  for (const service of services.splice(0)) {
    for (const room of Object.values(service.host.rooms)) {
      await service.connect(room.leaderID).controlAiRoom(room.roomID, 'stop', () => {});
    }
  }
  jest.restoreAllMocks();
  process.env = { ...environment };
});

function fixture(db: Db) {
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const host = {
    rooms: {},
    io,
    updateRoomsList: () => {},
    dbManager: {
      dbInstance: { connection: { db } },
      getUserByID: async (id: string) => ({ id, name: id, isAdmin: id.startsWith('admin-') }),
      getUserFeatures: async () => ({}),
    },
  } as unknown as Manager;
  const service = new AiService(host);
  const connect = (user: string) => {
    const events: Record<string, (...args: any[]) => Promise<void>> = {};
    service.register(
      {
        on: (event: string, handler: any) => {
          events[event] = handler;
        },
      } as unknown as ServerSocket,
      user,
    );
    return events;
  };
  const create = async (user: string) => {
    let response: { roomID?: string; error?: string } = {};
    await connect(user).createHumanAiRoom({ beginner: false, difficulty: 'regular' }, (result: any) => {
      response = result;
    });
    return response;
  };
  const result = { host, service, connect, create };
  services.push(result);
  return result;
}

async function until(check: () => Promise<boolean>) {
  for (let attempt = 0; attempt < 400; attempt++) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw Error('Expected asynchronous cleanup did not complete');
}

test('two games on one account reserve separately and the dashboard retains both live games', async () => {
  process.env.AI_CODEX_INSTANCES = JSON.stringify([{ id: 'one', home: '/pool/one', maxGames: 2 }]);
  const db = client.db(`two-games-${database++}`);
  const a = fixture(db);
  const b = fixture(db);
  const first = await a.create('first-human');
  const second = await b.create('second-human');
  expect(first.roomID).toBeDefined();
  expect(second.roomID).toBeDefined();
  expect((await a.create('overflow-human')).error).toBeDefined();
  expect(await a.service.repository!.busyInstances()).toEqual(
    expect.arrayContaining([
      { instanceID: 'one', roomID: first.roomID },
      { instanceID: 'one', roomID: second.roomID },
    ]),
  );
  let dashboard: any;
  await a.connect('admin-dashboard').getAiBotDashboard((value: any) => {
    dashboard = value;
  });
  expect(dashboard.instances).toHaveLength(1);
  expect(dashboard.instances[0]).toMatchObject({ id: 'one', maxGames: 2, status: 'busy' });
  expect(dashboard.instances[0].rooms.map((room: any) => room.roomID).sort()).toEqual(
    [first.roomID, second.roomID].sort(),
  );
  await a.connect('first-human').controlAiRoom(first.roomID, 'stop', () => {});
  await a.connect('admin-dashboard').getAiBotDashboard((value: any) => {
    dashboard = value;
  });
  expect(dashboard.instances[0].status).toBe('free');
  const replacement = await a.create('replacement-human');
  expect(replacement.roomID).toBeDefined();
});

test('the legacy dashboard observes the default account held by another backend', async () => {
  delete process.env.AI_CODEX_INSTANCES;
  const db = client.db(`legacy-dashboard-${database++}`);
  const a = fixture(db);
  await new AiRepository(db).claim('remote-room');
  let dashboard: any;
  await a.connect('admin-dashboard').getAiBotDashboard((value: any) => {
    dashboard = value;
  });
  expect(dashboard.instances[0]).toMatchObject({ id: 'default', status: 'busy', roomID: 'remote-room' });
});

test.each([
  {
    label: 'earlier reset beats higher percentage',
    firstReset: 14400,
    secondReset: 3600,
    secondPercent: 70,
    expected: 'two',
  },
  { label: 'insufficient quota is excluded', firstReset: 14400, secondReset: 3600, secondPercent: 60, expected: 'one' },
  {
    label: 'equal resets use remaining percentage',
    firstReset: 3600,
    secondReset: 3600,
    secondPercent: 70,
    expected: 'one',
  },
  {
    label: 'unknown resets use remaining percentage',
    firstReset: null,
    secondReset: null,
    secondPercent: 70,
    expected: 'one',
  },
  {
    label: 'known reset precedes unknown reset',
    firstReset: null,
    secondReset: 3600,
    secondPercent: 70,
    expected: 'two',
  },
  { label: 'expired reset is not preferred', firstReset: -3600, secondReset: 3600, secondPercent: 70, expected: 'two' },
])('smart account selection: $label', async ({ firstReset, secondReset, secondPercent, expected }) => {
  const now = Math.floor(Date.now() / 1000);
  jest.spyOn(limits, 'getCodexWeeklyLimit').mockImplementation(async () => {
    const first = codexEnvironment().AI_CODEX_HOME === '/pool/one';
    const reset = first ? firstReset : secondReset;
    return {
      remainingPercent: 80,
      resetsAt: now + 86400,
      checkedAt: Date.now(),
      shortTerm: { remainingPercent: first ? 90 : secondPercent, resetsAt: reset === null ? null : now + reset },
    };
  });
  const db = client.db(`pool-${database++}`);
  const service = fixture(db);
  const response = jest.fn();
  await service.connect('alice').createHumanAiRoom({ beginner: false, difficulty: 'smart' }, response);
  expect(response).toHaveBeenCalledWith({ roomID: expect.any(String) });
  expect(await new AiRepository(db).busyInstances()).toEqual([
    { instanceID: expected, roomID: response.mock.calls[0][0].roomID },
  ]);
});

test('two backend services atomically reserve different instances and share busy/release state', async () => {
  const db = client.db(`pool-${database++}`);
  const a = fixture(db);
  const b = fixture(db);
  const responses = await Promise.all([a.create('alice'), b.create('bob')]);
  expect(responses).toEqual([{ roomID: expect.any(String) }, { roomID: expect.any(String) }]);
  const repo = new AiRepository(db);
  const leases = await repo.busyInstances();
  expect(leases.map((lease) => lease.instanceID).sort()).toEqual(['one', 'two']);
  expect(new Set(leases.map((lease) => lease.roomID)).size).toBe(2);
  expect(await a.create('carol')).toHaveProperty('error');
  const access = jest.fn();
  await b.connect('carol').getAiRoomAccess(access);
  expect(access.mock.calls[0][0].botsBusy).toBe(true);
  await a.connect('alice').controlAiRoom(responses[0].roomID, 'stop', () => {});
  expect(await b.create('carol')).toHaveProperty('roomID');
  expect(await repo.busyInstances()).toHaveLength(2);
});

test('a pause renews the account lease for the full pause and terminal stop releases only that account', async () => {
  const db = client.db(`pool-${database++}`);
  const a = fixture(db);
  const b = fixture(db);
  const first = await a.create('alice');
  const second = await b.create('bob');
  expect(first.roomID).toBeDefined();
  jest.spyOn(BotRoom.prototype, 'run').mockImplementation(async function (this: BotRoom) {
    await db
      .collection('ai_experiment_budget')
      .updateOne({ owner: this.roomID }, { $set: { leaseUntil: new Date(Date.now() + 1000) } });
    this.ai!.status = 'paused';
    this.ai!.canResumeTechnical = true;
  });
  const response = jest.fn();
  await a.connect('alice').startHumanAiRoom(first.roomID, { difficulty: 'regular', language: 'en' }, response);
  expect(response).toHaveBeenCalledWith({ ok: true });
  await until(async () => {
    const lease = await db.collection('ai_experiment_budget').findOne({ owner: first.roomID });
    return Boolean(lease && lease.leaseUntil.getTime() - Date.now() > 15 * 60000);
  });
  const repo = new AiRepository(db);
  expect(await repo.busyInstances()).toHaveLength(2);
  expect(await b.create('carol')).toHaveProperty('error');
  await a.connect('alice').controlAiRoom(first.roomID, 'stop', () => {});
  await until(async () => (await repo.busyInstances()).length === 1);
  expect(await repo.busyInstances()).toEqual([{ instanceID: 'two', roomID: second.roomID }]);
});

test('a completed match frees capacity after cleanup without releasing another running match', async () => {
  const db = client.db(`pool-${database++}`);
  const a = fixture(db);
  const first = await a.create('alice');
  const second = await a.create('bob');
  jest.spyOn(BotRoom.prototype, 'run').mockImplementation(async function (this: BotRoom) {
    this.ai!.status = 'finished';
  });
  await a.connect('alice').startHumanAiRoom(first.roomID, { difficulty: 'regular', language: 'en' }, () => {});
  const repo = new AiRepository(db);
  await until(async () => (await repo.busyInstances()).length === 1);
  expect(await repo.busyInstances()).toEqual([{ instanceID: 'two', roomID: second.roomID }]);
  expect(await a.create('carol')).toHaveProperty('roomID');
});

test.each(['usage_limit', 'timeout'])('games only switch accounts for quota exhaustion (%s)', async (failure) => {
  const directory = await mkdtemp(join(tmpdir(), 'avalon-pool-pipeline-'));
  const calls = join(directory, 'calls');
  process.env.AI_CODEX_SSH_BIN = join(directory, 'ssh');
  process.env.AI_CODEX_INSTANCES = JSON.stringify(
    ['one', 'two'].map((id) => ({
      id,
      ssh: { host: `${id}.pool.example`, user: 'worker', key: '/keys/key', knownHosts: '/keys/hosts' },
    })),
  );
  await writeFile(
    process.env.AI_CODEX_SSH_BIN,
    `#!${process.execPath}
const fs=require('node:fs');const host=process.argv.at(-2);let input='';
process.stdin.on('data',d=>input+=d);process.stdin.on('end',()=>{
const r=JSON.parse(input);fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify({host,request:r})+'\\n');
console.log(JSON.stringify(r.operation==='decide'?{ok:false,error:${JSON.stringify(failure)}}:
{ok:true,result:{rateLimits:{primary:{windowDurationMins:300,usedPercent:10},secondary:{windowDurationMins:10080,usedPercent:20}}}}));
});`,
    { mode: 0o700 },
  );
  const db = client.db(`pool-${database++}`);
  const a = fixture(db);
  const b = fixture(db);
  const createAdmin = async (service: ReturnType<typeof fixture>, user: string) => {
    const response = jest.fn();
    await service.connect(user).createAiRoom('codex-chatgpt', response);
    const id = response.mock.calls[0][0].roomID;
    expect(id).toBeDefined();
    await service.connect(user).configureAiCodex(id, { model: 'gpt-6-luna', reasoning: 'medium' }, () => {});
    return id as string;
  };
  try {
    const one = await createAdmin(a, 'admin-one');
    const two = await createAdmin(b, 'admin-two');
    await Promise.all([
      a.connect('admin-one').controlAiRoom(one, 'start', () => {}),
      b.connect('admin-two').controlAiRoom(two, 'start', () => {}),
    ]);
    await until(async () => a.host.rooms[one].ai?.status === 'paused' && b.host.rooms[two].ai?.status === 'paused');
    await until(
      async () =>
        (await db.collection('ai_request_costs').countDocuments({ status: 'failed' })) ===
        (failure === 'usage_limit' ? 4 : 2),
    );
    const leases = await new AiRepository(db).busyInstances();
    expect(leases).toHaveLength(2);
    await Promise.all([
      a.connect('admin-one').controlAiRoom(one, 'stop', () => {}),
      b.connect('admin-two').controlAiRoom(two, 'stop', () => {}),
    ]);
    await until(async () => (await new AiRepository(db).busyInstances()).length === 0);
    const requests = (await readFile(calls, 'utf8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    expect(
      requests
        .filter((entry) => entry.request.operation === 'decide')
        .map((entry) => entry.host)
        .sort(),
    ).toEqual(
      failure === 'usage_limit'
        ? ['worker@one.pool.example', 'worker@one.pool.example', 'worker@two.pool.example', 'worker@two.pool.example']
        : ['worker@one.pool.example', 'worker@two.pool.example'],
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('exhausted quotas do not cache a failed beginner review before an instance can be reserved', async () => {
  const db = client.db(`pool-${database++}`);
  const a = fixture(db);
  await db.collection('ai_room_replays').insertOne({
    _id: 'review-game' as any,
    state: {
      roomID: 'review-game',
      stage: 'started',
      createAt: new Date().toISOString(),
      ai: {
        beginner: true,
        humanPlayerID: 'alice',
        model: 'codex-chatgpt',
        playedModel: 'gpt-6-luna',
        status: 'finished',
      },
      game: {
        stage: 'end',
        result: { winner: 'good', reason: 'goodTeamMissions' },
        settings: { roles: { good: ['servant'], evil: ['morgana'] } },
        players: [
          { id: 'alice', index: 1, role: 'servant' },
          { id: 'bot', index: 2, role: 'morgana' },
        ],
        history: [
          {
            type: 'vote',
            anonymous: false,
            forced: false,
            index: 0,
            leaderID: 'bot',
            team: [{ id: 'alice' }, { id: 'bot' }],
            result: 'approve',
            votes: [{ playerID: 'alice', value: 'approve' }],
          },
        ],
      },
    },
  });
  jest.spyOn(limits, 'getCodexWeeklyLimit').mockResolvedValue({
    remainingPercent: 50,
    checkedAt: Date.now(),
    resetsAt: null,
    shortTerm: { remainingPercent: 0, resetsAt: null },
  });
  const response = jest.fn();
  await a.connect('alice').getBeginnerReview('review-game', response);
  expect(response).toHaveBeenCalledWith({ status: 'unavailable' });
  expect(await db.collection('ai_beginner_reviews').findOne({ _id: 'review-game:alice' as any })).toBeNull();
});

test.each(['busy', 'free', 'least-loaded', 'collision'])(
  'quota failover preserves the request and chooses the right account (%s)',
  async (scenario) => {
    const hasFree = scenario === 'free';
    const leastLoaded = scenario === 'least-loaded';
    const collision = scenario === 'collision';
    const quota = () => ({ remainingPercent: 80, resetsAt: 2000000000, checkedAt: Date.now(), shortTerm: null });
    jest.spyOn(limits, 'getCodexWeeklyLimit').mockImplementation(async () => quota());
    const directory = await mkdtemp(join(tmpdir(), 'avalon-failover-'));
    const calls = join(directory, 'calls');
    process.env.AI_CODEX_SSH_BIN = join(directory, 'ssh');
    process.env.AI_CODEX_INSTANCES = JSON.stringify(
      (collision
        ? ['one', 'two', 'three', 'four']
        : hasFree || leastLoaded
          ? ['one', 'two', 'three']
          : ['one', 'two']
      ).map((id) => ({
        id,
        ...(leastLoaded && id === 'two' ? { maxGames: 2 } : {}),
        ssh: { host: `${id}.pool.example`, user: 'worker', key: '/keys/key', knownHosts: '/keys/hosts' },
      })),
    );
    await writeFile(
      process.env.AI_CODEX_SSH_BIN,
      `#!${process.execPath}
const fs=require('node:fs');const host=process.argv.at(-2);let input='';
process.stdin.on('data',d=>input+=d);process.stdin.on('end',()=>{
const r=JSON.parse(input);fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify({host,request:r})+'\\n');
console.log(JSON.stringify(host==='worker@one.pool.example'&&r.operation==='decide'
?{ok:false,error:'usage_limit'}:{ok:true,result:r.operation==='decide'
?{text:JSON.stringify({choice:r.schema.properties.choice.enum[0],speech:'',publicReason:'',evidence:[],claimMorgana:null,claimStances:[]}),usage:{input_tokens:42,output_tokens:5}}
:{rateLimits:{primary:{windowDurationMins:300,usedPercent:10},secondary:{windowDurationMins:10080,usedPercent:20}}}}));
});`,
      { mode: 0o700 },
    );
    const db = client.db(`failover-${database++}`);
    const a = fixture(db);
    const b = fixture(db);
    try {
      const response = jest.fn();
      await a.connect('admin-one').createAiRoom('codex-chatgpt', response);
      const id = response.mock.calls[0][0].roomID as string;
      expect(id).toBeDefined();
      await a.connect('admin-one').configureAiCodex(id, { model: 'gpt-6-luna', reasoning: 'medium' }, () => {});
      const sibling = await b.create('other-human');
      expect(sibling.roomID).toBeDefined();
      const siblings = [{ instanceID: 'two', roomID: sibling.roomID }];
      if (leastLoaded) {
        siblings.push({ instanceID: 'two', roomID: (await b.create('second-human')).roomID });
        siblings.push({ instanceID: 'three', roomID: (await b.create('third-human')).roomID });
      }
      if (collision) {
        const claim = AiRepository.prototype.claim;
        let raced = false;
        jest.spyOn(AiRepository.prototype, 'claim').mockImplementation(async function (
          this: AiRepository,
          roomID,
          instanceID,
          maxGames,
        ) {
          if (roomID === id && instanceID === 'three' && !raced) {
            raced = true;
            await claim.call(this, 'racing-room', 'three');
            siblings.push({ instanceID: 'three', roomID: 'racing-room' });
          }
          return claim.call(this, roomID, instanceID, maxGames);
        });
      }
      await a.connect('admin-one').controlAiRoom(id, 'start', () => {});
      await until(
        async () => (await db.collection('ai_request_costs').countDocuments({ roomID: id, status: 'completed' })) > 0,
      );
      const target = collision ? 'four' : hasFree || leastLoaded ? 'three' : 'two';
      const repo = new AiRepository(db);
      await repo.renewLease(id);
      await repo.claim(id, target);
      expect(await repo.busyInstances()).toHaveLength(siblings.length + 1);
      await a.connect('admin-one').controlAiRoom(id, 'stop', () => {});
      await until(async () => (await repo.busyInstances()).length === siblings.length);
      expect(await new AiRepository(db).busyInstances()).toEqual(expect.arrayContaining(siblings));
      const requests = (await readFile(calls, 'utf8'))
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line))
        .filter((entry) => entry.request.operation === 'decide');
      const original = requests.find((entry) => entry.host === 'worker@one.pool.example');
      expect(
        requests.some(
          (entry) => entry.host === `worker@${target}.pool.example` && entry.request.prompt === original.request.prompt,
        ),
      ).toBe(true);
      expect(
        requests.filter(
          (entry) => entry.host === 'worker@one.pool.example' && entry.request.prompt === original.request.prompt,
        ),
      ).toHaveLength(1);
      expect(await db.collection('ai_game_usage').findOne({ roomID: id })).toMatchObject({
        instanceID: target,
        sharedQuota: true,
      });
      const usage = await new AiRepository(db).weeklyAccountUsage([
        { id: 'one', quota: quota() },
        { id: target, quota: quota() },
      ]);
      expect(usage[0]).toMatchObject({ tokens: 0, gameCount: 1, weeklyIncomplete: true });
      const costs = await db.collection('ai_request_costs').find({ roomID: id, instanceID: target }).toArray();
      expect(usage[1].tokens).toBe(
        costs.reduce((sum, cost) => sum + (cost.inputTokens ?? 0) + (cost.outputTokens ?? 0), 0),
      );
      expect(usage[1].tokens).toBeGreaterThan(0);
      expect(usage[1].gameCount).toBe(1);
    } finally {
      // Stop before deleting the executable, including when an assertion fails.
      for (const room of Object.values(a.host.rooms))
        await a.connect(room.leaderID).controlAiRoom(room.roomID, 'stop', () => {});
      await until(async () => !(a.service as any).running.size);
      await rm(directory, { recursive: true, force: true });
    }
  },
);
