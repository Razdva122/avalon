import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { createHmac } from 'crypto';
import { supportRouter } from './routes';
import { SupportOrder } from './service';

const mockOrders: Record<string, SupportOrder> = {};
let mockPayment: Record<string, unknown>;
let mockProviderCalls = 0;
let mockFailStorage = false;
jest.mock('@/user', () => ({
  validateJWT: (token: string) => {
    if (token !== 'valid-token') throw Error('invalid');
    return { id: 'owner' };
  },
}));
jest.mock('@/db/models', () => ({
  userProfileModel: { exists: async () => true, find: () => ({ lean: async () => [] }) },
  userFeaturesModel: {
    find: () => ({ lean: async () => [] }),
    findOne: () => ({ lean: async () => null }),
    updateOne: async () => ({}),
    findOneAndUpdate: async () => ({ userID: 'owner' }),
  },
}));
jest.mock('./repository', () => ({
  MongoSupportRepository: class {
    async find(id: string) {
      return mockOrders[id] || null;
    }
    async updatePayment(id: string, paymentID: string, status: string, finished: boolean) {
      if (mockFailStorage) throw Error('storage failure');
      const order = mockOrders[id];
      if (!['finished', 'test_paid'].includes(order.status))
        Object.assign(order, { paymentID, status: finished ? 'finished' : status });
    }
  },
  supportTotalCents: async () =>
    Object.values(mockOrders)
      .filter((o) => o.status === 'finished' && !o.sandbox)
      .reduce((sum, o) => sum + o.amountCents, 0),
  supportOrderModel: {
    find: (query: Record<string, unknown>) => ({
      sort: () => ({
        limit: () => ({
          lean: async () =>
            Object.values(mockOrders).filter((o) =>
              query.userID ? o.userID === query.userID : o.status === 'finished' && !o.sandbox,
            ),
        }),
      }),
    }),
    findOne: ({ userID, orderId }: { userID: string; orderId: string }) => ({
      lean: async () => (mockOrders[orderId]?.userID === userID ? mockOrders[orderId] : null),
    }),
    create: async (order: SupportOrder) => {
      mockOrders[order.orderId] = { ...order };
    },
    updateOne: async ({ orderId }: { orderId: string }, { $set }: { $set: Record<string, unknown> }) => {
      Object.assign(mockOrders[orderId], $set);
    },
  },
}));
let server: Server;
let base: string;
const env = { ...process.env };
const realFetch = global.fetch;
beforeAll(async () => {
  const app = express();
  app.use('/api/support', supportRouter);
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/support`;
});
beforeEach(() => {
  process.env = {
    ...env,
    OXAPAY_MERCHANT_API_KEY: 'test-key',
    OXAPAY_SANDBOX: 'false',
    SUPPORT_FRONTEND_URL: 'https://example.com',
  };
  mockFailStorage = false;
  mockProviderCalls = 0;
  for (const key of Object.keys(mockOrders)) delete mockOrders[key];
  mockPayment = {
    track_id: '123',
    order_id: 'order-1',
    amount: 10,
    currency: 'USD',
    status: 'paid',
    type: 'invoice',
    under_paid_coverage: 0,
  };
  global.fetch = async (url, options) => {
    if (!String(url).startsWith('https://api.oxapay.com/')) return realFetch(url, options);
    mockProviderCalls++;
    return new Response(
      JSON.stringify({
        status: 200,
        error: null,
        data: options?.method === 'POST' ? { track_id: '123', payment_url: 'https://pay.oxapay.com/123' } : mockPayment,
      }),
    );
  };
});
afterAll(async () => {
  global.fetch = realFetch;
  process.env = env;
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
const auth = { authorization: 'Bearer valid-token', 'Content-Type': 'application/json' };
function seed(sandbox = false) {
  mockOrders['order-1'] = {
    orderId: 'order-1',
    userID: 'owner',
    provider: 'oxapay',
    sandbox,
    providerInvoiceId: 'oxapay:123',
    amountCents: 1000,
    payCurrency: 'crypto',
    anonymous: true,
    createdAt: new Date(),
    status: 'waiting',
  };
}
function notify(
  body = '{ "type": "invoice", "track_id": "123" }',
  signature = createHmac('sha512', 'test-key').update(body).digest('hex'),
) {
  return fetch(`${base}/oxapay/ipn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', hmac: signature },
    body,
  });
}

test('public config identifies OxaPay and defaults off without a merchant key', async () => {
  expect(await (await fetch(base)).json()).toMatchObject({ provider: 'oxapay', enabled: true, sandbox: false });
  delete process.env.OXAPAY_MERCHANT_API_KEY;
  expect(await (await fetch(base)).json()).toMatchObject({ enabled: false });
});
test('invoice creation is authenticated and ignores caller-supplied owner and sandbox', async () => {
  expect((await fetch(`${base}/invoice`, { method: 'POST' })).status).toBe(401);
  const r = await fetch(`${base}/invoice`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ amountUSD: '10', anonymous: true, userID: 'victim', sandbox: true }),
  });
  expect(r.status).toBe(200);
  const body = await r.json();
  expect(mockOrders[body.id]).toMatchObject({
    userID: 'owner',
    sandbox: false,
    provider: 'oxapay',
    providerInvoiceId: 'oxapay:123',
    status: 'waiting',
  });
});
test('raw webhook verifies signature without user auth and returns literal ok after processing', async () => {
  seed();
  expect((await notify('{}', 'a'.repeat(128))).status).toBe(401);
  expect(mockProviderCalls).toBe(0);
  const r = await notify();
  expect(r.status).toBe(200);
  expect(await r.text()).toBe('ok');
  expect(mockOrders['order-1'].status).toBe('finished');
});
test('a claimed paid webhook cannot override an underpaid status from the API', async () => {
  seed();
  mockPayment.status = 'underpaid';
  expect((await notify('{"type":"invoice","track_id":"123","status":"paid"}')).status).toBe(200);
  expect(mockOrders['order-1'].status).toBe('partially_paid');
});
test('storage failures are retryable and signed payout callbacks are rejected', async () => {
  seed();
  mockFailStorage = true;
  expect((await notify()).status).toBe(503);
  expect((await notify('{"type":"payout","track_id":"123"}')).status).toBe(400);
});
test('owner refresh recovers a missing webhook using the saved invoice track ID', async () => {
  seed();
  expect((await fetch(`${base}/orders/order-1/refresh`, { method: 'POST', headers: auth })).status).toBe(200);
  expect(mockOrders['order-1'].status).toBe('finished');
});
test('refresh cannot credit an order belonging to another user', async () => {
  seed();
  mockOrders['order-1'].userID = 'victim';
  expect((await fetch(`${base}/orders/order-1/refresh`, { method: 'POST', headers: auth })).status).toBe(404);
  expect(mockProviderCalls).toBe(0);
});
test('sandbox payment grants no Premium or public donation but is visible in history', async () => {
  seed(true);
  expect((await notify()).status).toBe(200);
  const me = await (await fetch(`${base}/me`, { headers: auth })).json();
  expect(me).toMatchObject({ totalUSD: 0, premium: false, orders: [{ status: 'test_paid', sandbox: true }] });
  expect((await (await fetch(base)).json()).donations).toEqual([]);
});
