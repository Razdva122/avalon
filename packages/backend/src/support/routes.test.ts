import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { createHmac } from 'crypto';
import { supportRouter } from './routes';

jest.mock('@/user', () => ({
  validateJWT: (token: string) => {
    if (token !== 'valid-token') throw new Error('invalid');
    return { id: 'authenticated-user' };
  },
}));
jest.mock('@/db/models', () => ({
  userProfileModel: {
    exists: async () => true,
    find: () => ({ lean: async () => [{ id: 'donor', name: 'Hidden Name' }] }),
  },
  userFeaturesModel: {
    find: () => ({ lean: async () => [{ userID: 'donor', hideSupport: true }] }),
    updateOne: async () => ({}),
  },
}));
jest.mock('./repository', () => ({
  MongoSupportRepository: class {
    async find() {
      return null;
    }
  },
  supportOrderModel: {
    find: () => ({
      sort: () => ({
        limit: () => ({
          lean: async () => [
            {
              orderId: 'public-id',
              userID: 'donor',
              amountCents: 1000,
              anonymous: false,
              createdAt: new Date('2026-09-16'),
              paymentID: 'private-id',
            },
          ],
        }),
      }),
    }),
    findOne: ({ userID, orderId }: { userID: string; orderId: string }) => ({
      lean: async () =>
        orderId === 'missing-notification'
          ? { orderId, status: 'waiting' }
          : userID === 'victim'
            ? { paymentID: '123' }
            : null,
    }),
  },
}));
let server: Server;
let base: string;
const env = { ...process.env };
beforeAll(async () => {
  Object.assign(process.env, {
    NOWPAYMENTS_API_KEY: 'test',
    NOWPAYMENTS_IPN_SECRET: 'test-secret',
    NOWPAYMENTS_CALLBACK_URL: 'https://example.com/ipn',
    SUPPORT_FRONTEND_URL: 'https://example.com',
    NOWPAYMENTS_USDT_CURRENCIES: 'usdttrc20',
  });
  const app = express();
  app.use('/api/support', supportRouter);
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/support`;
});
afterAll(async () => {
  process.env = { ...env };
  if (server?.listening) {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('public feed omits hidden donor identity and private transaction metadata', async () => {
  const response = await fetch(base);
  expect(response.headers.get('cache-control')).toBe('no-store');
  const body = await response.json();
  expect(body.donations).toEqual([{ id: 'public-id', name: null, amountUSD: 10, date: '2026-09-16' }]);
});
test('private endpoints reject missing and forged authentication', async () => {
  for (const authorization of ['', 'Bearer forged-token']) {
    const response = await fetch(`${base}/invoice`, { method: 'POST', headers: { authorization } });
    expect(response.status).toBe(401);
  }
});
test('webhook rejects forged signatures before any order processing', async () => {
  const response = await fetch(`${base}/nowpayments/ipn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-nowpayments-sig': 'a'.repeat(128) },
    body: '{}',
  });
  expect(response.status).toBe(401);
});
test('signed unknown orders remain retryable rather than silently acknowledged', async () => {
  const body = '{"order_id":"unknown"}';
  const signature = createHmac('sha512', 'test-secret').update(body).digest('hex');
  const response = await fetch(`${base}/nowpayments/ipn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-nowpayments-sig': signature },
    body,
  });
  expect(response.status).toBe(503);
});
test('owner refresh ignores caller supplied user IDs', async () => {
  const response = await fetch(`${base}/orders/victim-order/refresh`, {
    method: 'POST',
    headers: { authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
    body: '{"userID":"victim"}',
  });
  expect(response.status).toBe(404);
});
test('privacy endpoint rejects non-boolean values', async () => {
  const response = await fetch(`${base}/privacy`, {
    method: 'PATCH',
    headers: { authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
    body: '{"hideSupport":"false","showPremiumBadge":true}',
  });
  expect(response.status).toBe(400);
});

test('refresh explains when recovery needs an operator instead of claiming success', async () => {
  const response = await fetch(`${base}/orders/missing-notification/refresh`, {
    method: 'POST',
    headers: { authorization: 'Bearer valid-token' },
  });
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({ error: 'awaiting_notification' });
});
