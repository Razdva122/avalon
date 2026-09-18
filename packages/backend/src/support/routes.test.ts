import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { createSupportRouter } from './routes';
import { DirectService } from './direct/service';
import { configuredNetworks } from './direct/config';
import { supportOrderModel } from './repository';
import { userFeaturesModel, userProfileModel } from '@/db/models';

jest.mock('@/user/sessions', () => ({
  authenticatedUser: async (token: string) => {
    if (!['alice', 'bob'].includes(token)) throw new Error('unauthorized');
    return { id: token };
  },
}));
jest.setTimeout(120000);
let mongo: MongoMemoryServer;
let server: Server;
let base: string;
let time: number;
const txid = '0x' + 'ab'.repeat(32);
const networks = configuredNetworks({
  DIRECT_SUPPORT_ENABLED: 'true',
  SUPPORT_ETH_RPC_URL: 'https://private-rpc.example/secret',
});
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await supportOrderModel.init();
  const service = new DirectService({
    networks: () => networks,
    now: () => new Date(time),
    ready: async () => true,
    read: async () => ({
      status: 'verified',
      amountAtomic: '10500000',
      blockHash: '0x' + 'cd'.repeat(32),
      blockHeight: 100,
    }),
    value: async () => ({ amountCents: 1050, usdRate: '1', rateSource: 'fixed:USDT-USD', valuedAt: new Date(time) }),
  });
  const app = express();
  app.use('/api/support', createSupportRouter(service));
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/support`;
});
beforeEach(async () => {
  time = Date.now();
  await Promise.all([
    supportOrderModel.deleteMany({}),
    userProfileModel.deleteMany({}),
    userFeaturesModel.deleteMany({}),
    mongoose.connection.db!.collection('directsupportlimits').deleteMany({}),
  ]);
  await userProfileModel.collection.insertMany([
    { login: 'alice', email: 'alice@example.test', id: 'alice', name: 'Alice', avatar: 'merlin' },
    { login: 'bob', email: 'bob@example.test', id: 'bob', name: 'Bob' },
  ]);
});
afterAll(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((r) => server.close(() => r()));
  }
  await mongoose.disconnect();
  await mongo?.stop();
});
function submit(token = 'alice', body: unknown = { network: 'eth', txid, anonymous: true }) {
  return fetch(`${base}/transfers`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
test('public network info contains recipient and contract, never RPC credentials', async () => {
  const response = await fetch(base);
  const body = await response.json();
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(body).toMatchObject({
    enabled: true,
    provider: 'direct',
    networks: [{ id: 'eth', address: networks[0].address }],
  });
  expect(JSON.stringify(body)).not.toContain('private-rpc');
});
test('claims require real authentication and ignore client owner and amount', async () => {
  expect((await submit('forged')).status).toBe(401);
  const response = await submit('alice', { network: 'eth', txid, anonymous: false, userID: 'bob', amountUSD: 99999 });
  expect(response.status).toBe(200);
  const order = await response.json();
  expect(order).toMatchObject({ status: 'finished', amountUSD: 10.5 });
  expect(await supportOrderModel.findOne({ orderId: order.id })).toMatchObject({ userID: 'alice', amountCents: 1050 });
});
test('private history includes transfer details, public feed honors privacy', async () => {
  await submit();
  const me = await (await fetch(`${base}/me`, { headers: { authorization: 'Bearer alice' } })).json();
  expect(me).toMatchObject({ totalUSD: 10.5, premium: true, orders: [{ network: 'eth', txid, amountCrypto: '10.5' }] });
  const feed = await (await fetch(base)).json();
  expect(feed.donations[0]).toMatchObject({ name: null, userID: null, amountUSD: 10.5 });
  expect(JSON.stringify(feed)).not.toContain(txid);
  expect(JSON.stringify(me)).not.toContain('leaseToken');
});
test('double claim reveals no owner; refresh enforces ownership', async () => {
  const first = await (await submit()).json();
  const conflict = await submit('bob');
  expect(conflict.status).toBe(409);
  expect(await conflict.json()).toEqual({ error: 'already_claimed' });
  expect(
    (await fetch(`${base}/orders/${first.id}/refresh`, { method: 'POST', headers: { authorization: 'Bearer bob' } }))
      .status,
  ).toBe(404);
});
test('invalid input returns actionable errors and private settings require booleans', async () => {
  expect((await submit('alice', { network: 'eth', txid: 'wrong', anonymous: true })).status).toBe(400);
  const response = await fetch(`${base}/privacy`, {
    method: 'PATCH',
    headers: { authorization: 'Bearer alice', 'Content-Type': 'application/json' },
    body: '{"hideSupport":"false","showPremiumBadge":true}',
  });
  expect(response.status).toBe(400);
  expect(await supportOrderModel.countDocuments()).toBe(0);
});
