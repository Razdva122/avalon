/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServer, type Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';
import jwt from 'jsonwebtoken';
import { Server as SocketServer } from 'socket.io';
import { io as connect, type Socket as ClientSocket } from 'socket.io-client';
import { config } from '@/config';
import { installSessionChecks } from '@/user/sessions';
import { installSocketAdmission } from '@/security/socket-admission';
import { handleSocketErrors } from '@/helpers/socket';
import { AiService } from './service';
import { defaultBotQuotaThresholds } from './quota-policy';
import * as limits from './codex-limits';
import * as models from './codex-models';
import type { Manager } from '@/main';
import type { AiRepository } from './repository';
import type { Server, ServerSocket } from '@avalon/types';

const accounts = new Map<string, { authVersion: number; isAdmin: boolean }>();
jest.mock('@/db/models', () => ({
  userProfileModel: {
    exists: async (filter: { id: string; $expr: { $eq: [unknown, number] } }) =>
      accounts.get(filter.id)?.authVersion === filter.$expr.$eq[1] ? { _id: 'exists' } : null,
  },
}));
const environment = { ...process.env };
const originalSecret = config.SECRET_KEY;
let server: HttpServer;
let io: SocketServer;
let url: string;
let thresholds = structuredClone(defaultBotQuotaThresholds);
const clients: ClientSocket[] = [];

beforeAll(async () => {
  config.SECRET_KEY = 'admin-dashboard-test-key';
  process.env.NODE_ENV = 'development';
  process.env.AI_CODEX_ENABLED = 'true';
  delete process.env.AI_CODEX_INSTANCES;
  jest
    .spyOn(limits, 'getCodexWeeklyLimit')
    .mockResolvedValue({ remainingPercent: 80, shortTerm: null, resetsAt: null, checkedAt: 123 });
  jest.spyOn(models, 'getCodexModels').mockResolvedValue([
    { id: 'gpt-6-luna', label: 'Luna', efforts: ['low', 'medium'] },
    { id: 'gpt-6.1-terra', label: 'Terra', efforts: ['low', 'medium'] },
  ]);
  const service = new AiService({
    rooms: {},
    dbManager: {
      getUserByID: async (id: string) => {
        const account = accounts.get(id);
        if (!account) throw Error('deleted');
        return account;
      },
    },
  } as unknown as Manager);
  service.repository = {
    busyInstances: async () => [],
    recentGameUsage: async () => [],
    weeklyAccountUsage: async () => [],
    getBotQuotaThresholds: async () => structuredClone(thresholds),
    setBotQuotaThresholds: async (value: typeof thresholds) => {
      thresholds = structuredClone(value);
    },
  } as unknown as AiRepository;
  server = createServer();
  io = new SocketServer(server);
  installSocketAdmission(io as Server);
  installSessionChecks(io as Server);
  io.on('connection', (socket) => {
    handleSocketErrors(socket as ServerSocket);
    service.register(socket as ServerSocket, socket.data.authUser?.id);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
beforeEach(() => {
  accounts.set('admin', { authVersion: 0, isAdmin: true });
  accounts.set('member', { authVersion: 0, isAdmin: false });
  thresholds = structuredClone(defaultBotQuotaThresholds);
});

test('reset credits are consumed only through a validated admin request', async () => {
  const consume = jest.spyOn(limits, 'consumeCodexReset').mockResolvedValue('reset');
  const request = {
    instanceID: 'default',
    idempotencyKey: '8ae96ff3-3425-4f4c-8772-b6fd61502868',
    creditId: 'RateLimitResetCredit_1',
  };
  const member = await client('member');
  expect(await member.timeout(2000).emitWithAck('consumeAiBotReset', request)).toEqual({
    error: 'AI room access denied',
  });
  const admin = await client('admin');
  expect(await admin.timeout(2000).emitWithAck('consumeAiBotReset', { ...request, idempotencyKey: '' })).toEqual({
    error: 'invalidRequest',
  });
  expect(consume).not.toHaveBeenCalled();
  expect(await admin.timeout(2000).emitWithAck('consumeAiBotReset', request)).toEqual({ outcome: 'reset' });
  expect(consume).toHaveBeenCalledTimes(1);
  consume.mockRestore();
});
afterEach(() => {
  for (const client of clients.splice(0)) client.disconnect();
});
afterAll(async () => {
  await new Promise<void>((resolve) => io?.close(() => resolve()));
  jest.restoreAllMocks();
  process.env = { ...environment };
  config.SECRET_KEY = originalSecret;
});
async function client(id?: string, secret = config.SECRET_KEY) {
  // A valid member token can claim admin status; only the database decides authority.
  const token = id ? jwt.sign({ id, authVersion: 0, isAdmin: true }, secret, { expiresIn: '1h' }) : undefined;
  const socket = connect(url, {
    auth: { token, isAdmin: true, userID: 'admin' },
    transports: ['websocket'],
    reconnection: false,
  });
  clients.push(socket);
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
  return socket;
}

test.each([undefined, 'member'])(
  'guest/member cannot read or change thresholds even with admin claims: %s',
  async (id) => {
    const socket = await client(id);
    expect(await socket.timeout(2000).emitWithAck('getAiBotDashboard')).toEqual({ error: 'AI room access denied' });
    expect(
      await socket
        .timeout(2000)
        .emitWithAck('setAiBotQuotaThresholds', { ...thresholds, smart: { shortTerm: 1, weekly: 0 } }),
    ).toEqual({ error: 'AI room access denied' });
    expect(thresholds.smart).toEqual({ shortTerm: 60, weekly: 5 });
  },
);

test('a forged signature grants no dashboard access', async () => {
  const socket = await client('admin', 'attacker-key');
  expect(await socket.timeout(2000).emitWithAck('getAiBotDashboard')).toEqual({ error: 'AI room access denied' });
});

test('admin can use the endpoints; malformed packets cannot change persisted thresholds', async () => {
  const socket = await client('admin');
  const changed = { ...thresholds, regular: { weekly: 7, shortTerm: 40 } };
  expect(await socket.timeout(2000).emitWithAck('setAiBotQuotaThresholds', changed)).toEqual({ ok: true });
  expect((await socket.timeout(2000).emitWithAck('getAiBotDashboard')).thresholds).toEqual(changed);
  expect(await socket.timeout(2000).emitWithAck('getAiBotDashboard', 'admin')).toEqual({ error: 'invalidRequest' });
  expect(
    await socket
      .timeout(2000)
      .emitWithAck('setAiBotQuotaThresholds', { ...changed, regular: { weekly: -1, shortTerm: 20 } }),
  ).toEqual({ error: 'invalidRequest' });
  expect(thresholds).toEqual(changed);
});

test('removing admin rights rejects reads and writes on an already connected socket', async () => {
  const socket = await client('admin');
  expect(await socket.timeout(2000).emitWithAck('getAiBotDashboard')).toHaveProperty('instances');
  accounts.get('admin')!.isAdmin = false;
  expect(await socket.timeout(2000).emitWithAck('getAiBotDashboard')).toEqual({ error: 'AI room access denied' });
  expect(await socket.timeout(2000).emitWithAck('setAiBotQuotaThresholds', thresholds)).toEqual({
    error: 'AI room access denied',
  });
});

test.each(['revoked', 'deleted'])(
  'an existing admin socket cannot read data after its session is %s',
  async (reason) => {
    const socket = await client('admin');
    if (reason === 'revoked') accounts.get('admin')!.authVersion++;
    else accounts.delete('admin');
    let responded = false;
    const disconnected = new Promise<void>((resolve) => socket.once('disconnect', () => resolve()));
    socket.emit('getAiBotDashboard', () => {
      responded = true;
    });
    await disconnected;
    expect(responded).toBe(false);
  },
);
