import { createHmac } from 'crypto';
import { OxaPay, oxaPayConfig, oxaCheckoutURL, verifyOxaSignature } from './oxapay';

const config = {
  apiKey: 'test-merchant-key',
  callbackURL: 'https://example.com/api/support/oxapay/ipn',
  frontendURL: 'https://example.com',
  sandbox: true,
};
const originalFetch = global.fetch;
const originalEnv = { ...process.env };
afterEach(() => {
  global.fetch = originalFetch;
  process.env = { ...originalEnv };
  jest.restoreAllMocks();
});

test('creates a USD invoice with no underpayment, no auto-withdrawal and server-controlled sandbox mode', async () => {
  let request: Record<string, unknown> | undefined;
  global.fetch = jest.fn(async (url, options) => {
    expect(String(url)).toBe('https://api.oxapay.com/v1/payment/invoice');
    expect(options?.headers).toMatchObject({ merchant_api_key: config.apiKey });
    request = JSON.parse(String(options?.body));
    return new Response(
      JSON.stringify({
        status: 200,
        error: null,
        data: { track_id: '123456', payment_url: 'https://pay.oxapay.com/123456' },
      }),
    );
  });
  expect(await new OxaPay(config).createInvoice({ orderId: 'order-1', amountCents: 1000 })).toEqual({
    providerInvoiceId: 'oxapay:123456',
    checkoutUrl: 'https://pay.oxapay.com/123456',
  });
  expect(request).toMatchObject({
    amount: 10,
    currency: 'USD',
    order_id: 'order-1',
    sandbox: true,
    under_paid_coverage: 0,
    mixed_payment: false,
    fee_paid_by_payer: 0,
    auto_withdrawal: false,
    callback_url: config.callbackURL,
  });
  expect(request).not.toHaveProperty('pay_currency');
});

test('configuration defaults to sandbox and requires explicit false to enable real invoices', () => {
  delete process.env.OXAPAY_MERCHANT_API_KEY;
  expect(oxaPayConfig()).toBeNull();
  Object.assign(process.env, { OXAPAY_MERCHANT_API_KEY: config.apiKey, SUPPORT_FRONTEND_URL: config.frontendURL });
  delete process.env.OXAPAY_SANDBOX;
  delete process.env.OXAPAY_CALLBACK_URL;
  expect(oxaPayConfig()).toMatchObject({ sandbox: true, callbackURL: config.callbackURL });
  process.env.OXAPAY_SANDBOX = 'false';
  expect(oxaPayConfig()?.sandbox).toBe(false);
  process.env.OXAPAY_SANDBOX = 'FALSE_typo';
  expect(oxaPayConfig()).toBeNull();
});

test('webhook authenticates exact raw bytes, never sorted or reserialized JSON', () => {
  const raw = Buffer.from('{ "track_id": "123456", "type": "invoice" }');
  const signature = createHmac('sha512', config.apiKey).update(raw).digest('hex');
  expect(verifyOxaSignature(raw, signature, config.apiKey)).toBe(true);
  expect(verifyOxaSignature(Buffer.from(JSON.stringify(JSON.parse(raw.toString()))), signature, config.apiKey)).toBe(
    false,
  );
  expect(verifyOxaSignature(raw, 'a'.repeat(128), config.apiKey)).toBe(false);
  expect(verifyOxaSignature(raw, undefined, config.apiKey)).toBe(false);
});

test('rejects untrusted payment URLs and unsafe track IDs before requesting the API', async () => {
  for (const url of [
    'https://pay.oxapay.com.evil.org/x',
    'http://pay.oxapay.com/x',
    'https://user@pay.oxapay.com/x',
    'https://nowpayments.io/x',
  ])
    expect(() => oxaCheckoutURL(url)).toThrow();
  await expect(new OxaPay(config).getPayment('../payout')).rejects.toThrow();
});

test('handles non-JSON denial and HTTP-200 API errors without disclosing secrets or repeating a POST', async () => {
  const logs = jest.spyOn(console, 'warn').mockImplementation(() => {});
  let requests = 0;
  global.fetch = jest.fn(async () => {
    requests++;
    return new Response('<html>' + config.apiKey + '</html>', { status: 403 });
  });
  await expect(new OxaPay(config).createInvoice({ orderId: 'order-1', amountCents: 1000 })).rejects.toThrow(
    'provider_unavailable',
  );
  expect(requests).toBe(1);
  expect(JSON.stringify(logs.mock.calls)).not.toContain(config.apiKey);
  global.fetch = jest.fn(
    async () => new Response(JSON.stringify({ status: 400, error: { message: config.apiKey }, data: {} })),
  );
  await expect(new OxaPay(config).getPayment('123456')).rejects.toThrow('provider_unavailable');
});
