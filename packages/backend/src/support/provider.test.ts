import { NowPayments, SupportConfig, supportConfig } from './provider';
const config: SupportConfig = {
  apiKey: 'test-only-key',
  ipnSecret: 'test-only-secret',
  callbackURL: 'https://example.com/api/support/nowpayments/ipn',
  frontendURL: 'https://example.com',
  currencies: ['usdttrc20'],
};
const originalFetch = global.fetch;
const originalEnv = { ...process.env };
beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  global.fetch = originalFetch;
  process.env = { ...originalEnv };
});

test('creates an account-bound USD invoice payable in the selected USDT network', async () => {
  const requests: { url: string; body?: Record<string, unknown> }[] = [];
  global.fetch = jest.fn(async (url, options) => {
    requests.push({ url: String(url), body: options?.body ? JSON.parse(String(options.body)) : undefined });
    return new Response(
      JSON.stringify(
        String(url).endsWith('/merchant/coins')
          ? { selectedCurrencies: ['USDTTRC20'] }
          : String(url).includes('/estimate?')
            ? { estimated_amount: 10 }
            : String(url).includes('/min-amount?')
              ? { min_amount: 1 }
              : { id: 42, invoice_url: 'https://nowpayments.io/payment/?iid=42' },
      ),
      { status: 200 },
    );
  });
  expect(
    await new NowPayments(config).createInvoice({ orderId: 'local-id', amountCents: 1000, payCurrency: 'usdttrc20' }),
  ).toEqual({ providerInvoiceId: '42', checkoutUrl: 'https://nowpayments.io/payment/?iid=42' });
  expect(requests.find((request) => request.url.endsWith('/invoice'))?.body).toMatchObject({
    order_id: 'local-id',
    price_amount: 10,
    price_currency: 'usd',
    pay_currency: 'usdttrc20',
    ipn_callback_url: config.callbackURL,
    is_fee_paid_by_user: false,
  });
});
test('rejects unavailable networks and provider-controlled redirect hosts', async () => {
  global.fetch = jest.fn(async () => new Response(JSON.stringify({ selectedCurrencies: [] }), { status: 200 }));
  await expect(
    new NowPayments(config).createInvoice({ orderId: 'x', amountCents: 1000, payCurrency: 'usdttrc20' }),
  ).rejects.toThrow('network_unavailable');
  global.fetch = jest.fn(
    async (url) =>
      new Response(
        JSON.stringify(
          String(url).endsWith('/merchant/coins')
            ? { selectedCurrencies: ['USDTTRC20'] }
            : String(url).includes('/estimate?')
              ? { estimated_amount: 10 }
              : String(url).includes('/min-amount?')
                ? { min_amount: 1 }
                : { id: 1, invoice_url: 'https://evil.example/' },
        ),
        { status: 200 },
      ),
  );
  await expect(
    new NowPayments(config).createInvoice({ orderId: 'x', amountCents: 1000, payCurrency: 'usdttrc20' }),
  ).rejects.toThrow();
});
test('payment status lookup rejects path injection and hides upstream error bodies', async () => {
  await expect(new NowPayments(config).getPayment('../auth')).rejects.toThrow('invalid_payment');
  global.fetch = jest.fn(async () => new Response('secret upstream diagnostic', { status: 500 }));
  await expect(new NowPayments(config).getPayment('42')).rejects.toThrow('provider_unavailable');
});
test('checkout stays disabled without credentials, HTTPS URLs or USDT-only network configuration', () => {
  for (const key of Object.keys(process.env))
    if (key.startsWith('NOWPAYMENTS_') || key === 'SUPPORT_FRONTEND_URL') delete process.env[key];
  expect(supportConfig()).toBeNull();
  Object.assign(process.env, {
    NOWPAYMENTS_API_KEY: config.apiKey,
    NOWPAYMENTS_IPN_SECRET: config.ipnSecret,
    NOWPAYMENTS_CALLBACK_URL: config.callbackURL,
    SUPPORT_FRONTEND_URL: config.frontendURL,
    NOWPAYMENTS_USDT_CURRENCIES: 'usdttrc20',
  });
  expect(supportConfig()?.currencies).toEqual(['usdttrc20']);
  process.env.NOWPAYMENTS_USDT_CURRENCIES = 'btc';
  expect(supportConfig()).toBeNull();
  process.env.NOWPAYMENTS_USDT_CURRENCIES = 'usdttrc20';
  process.env.NOWPAYMENTS_CALLBACK_URL = 'http://localhost/ipn';
  expect(supportConfig()).toBeNull();
});

test('rejects below-minimum checkout before an unusable invoice is created', async () => {
  const paths: string[] = [];
  global.fetch = jest.fn(async (url) => {
    const path = String(url);
    paths.push(path);
    const payload = path.endsWith('/merchant/coins')
      ? { selectedCurrencies: ['USDTTRC20'] }
      : path.includes('/estimate?')
        ? { estimated_amount: 10 }
        : path.includes('/min-amount?')
          ? { min_amount: 15 }
          : { id: 42, invoice_url: 'https://nowpayments.io/payment/?iid=42' };
    return new Response(JSON.stringify(payload), { status: 200 });
  });
  await expect(
    new NowPayments(config).createInvoice({ orderId: 'x', amountCents: 1000, payCurrency: 'usdttrc20' }),
  ).rejects.toMatchObject({ minimumUSD: 15 });
  expect(paths.some((path) => path.endsWith('/invoice'))).toBe(false);
});

test('network minimums round up and isolate a failing network', async () => {
  global.fetch = jest.fn(async (url) => {
    const path = String(url);
    if (path.includes('usdtbsc')) return new Response('{}', { status: 503 });
    const body = path.endsWith('/merchant/coins')
      ? { selectedCurrencies: ['USDTTRC20', 'USDTBSC'] }
      : path.includes('/estimate?')
        ? { estimated_amount: '9.9' }
        : { min_amount: '16.48' };
    return new Response(JSON.stringify(body), { status: 200 });
  });
  expect(
    await new NowPayments({ ...config, currencies: ['usdttrc20', 'usdtbsc', 'usdterc20'] }).networkMinimums(),
  ).toEqual([
    { currency: 'usdttrc20', minimumUSD: 16.65, minimumUSDT: 16.48, available: true },
    { currency: 'usdtbsc', available: false, reason: 'lookup_failed' },
    { currency: 'usdterc20', available: false, reason: 'not_enabled' },
  ]);
});

test('distinguishes an unselected currency from a failed quote without exposing provider details', async () => {
  const logs = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    global.fetch = jest.fn(async (url) => {
      if (String(url).endsWith('/merchant/coins'))
        return new Response(JSON.stringify({ selectedCurrencies: ['USDTTRC20'] }));
      return new Response(
        JSON.stringify({ code: 'INVALID_API_KEY', message: config.apiKey, address: 'private-address' }),
        { status: 401 },
      );
    });
    const result = await new NowPayments({ ...config, currencies: ['usdttrc20', 'usdterc20'] }).networkMinimums();
    expect(result).toEqual([
      { currency: 'usdttrc20', available: false, reason: 'lookup_failed' },
      { currency: 'usdterc20', available: false, reason: 'not_enabled' },
    ]);
    const output = JSON.stringify(logs.mock.calls);
    expect(output).toContain('401');
    expect(output).toContain('usdttrc20');
    expect(output).toContain('INVALID_API_KEY');
    expect(output).not.toContain(config.apiKey);
    expect(output).not.toContain('private-address');
  } finally {
    logs.mockRestore();
  }
});

test('loads all networks when the provider rejects overlapping estimate requests', async () => {
  let estimating = false;
  global.fetch = jest.fn(async (url) => {
    const path = String(url);
    if (path.endsWith('/merchant/coins'))
      return new Response(JSON.stringify({ selectedCurrencies: ['USDTTRC20', 'USDTBSC'] }));
    if (path.includes('/estimate?')) {
      if (estimating) return new Response('{}', { status: 429 });
      estimating = true;
      await new Promise((resolve) => setTimeout(resolve, 20));
      estimating = false;
      return new Response(JSON.stringify({ estimated_amount: 10 }));
    }
    return new Response(JSON.stringify({ min_amount: 4 }));
  });
  const result = await new NowPayments({ ...config, currencies: ['usdttrc20', 'usdtbsc'] }).networkMinimums();
  expect(result.every((network) => network.available)).toBe(true);
});

test('retries a rate-limited GET once', async () => {
  let calls = 0;
  global.fetch = jest.fn(async () =>
    ++calls === 1
      ? new Response('{}', { status: 429, headers: { 'Retry-After': '0' } })
      : new Response(JSON.stringify({ payment_id: 42 })),
  );
  await expect(new NowPayments(config).getPayment('42')).resolves.toEqual({ payment_id: 42 });
});

test('does not repeat a rate-limited invoice POST, preventing duplicate invoices', async () => {
  let invoices = 0;
  global.fetch = jest.fn(async (url) => {
    const path = String(url);
    if (path.endsWith('/merchant/coins')) return new Response(JSON.stringify({ selectedCurrencies: ['USDTTRC20'] }));
    if (path.includes('/estimate?')) return new Response(JSON.stringify({ estimated_amount: 10 }));
    if (path.includes('/min-amount?')) return new Response(JSON.stringify({ min_amount: 4 }));
    invoices++;
    return new Response('{}', { status: 429, headers: { 'Retry-After': '0' } });
  });
  await expect(
    new NowPayments(config).createInvoice({ orderId: 'x', amountCents: 1000, payCurrency: 'usdttrc20' }),
  ).rejects.toThrow('provider_unavailable');
  expect(invoices).toBe(1);
});

test('stops after the second rate-limited GET and redacts payment IDs and unknown error codes', async () => {
  let requests = 0;
  global.fetch = jest.fn(async () => {
    requests++;
    return new Response(JSON.stringify({ code: config.apiKey, message: config.ipnSecret }), {
      status: 429,
      headers: { 'Retry-After': '0' },
    });
  });
  await expect(new NowPayments(config).getPayment('123456789')).rejects.toThrow('provider_unavailable');
  expect(requests).toBe(2);
  const output = JSON.stringify((console.warn as jest.Mock).mock.calls);
  expect(output).not.toContain('123456789');
  expect(output).not.toContain(config.apiKey);
  expect(output).not.toContain(config.ipnSecret);
});

test('waits for the in-flight estimate after a minimum failure before starting the next network', async () => {
  let active = 0;
  let maximum = 0;
  global.fetch = jest.fn(async (url) => {
    const path = String(url);
    if (path.endsWith('/merchant/coins'))
      return new Response(JSON.stringify({ selectedCurrencies: ['USDTTRC20', 'USDTBSC'] }));
    if (path.includes('/estimate?')) {
      maximum = Math.max(maximum, ++active);
      await new Promise((resolve) => setTimeout(resolve, 20));
      active--;
      return new Response(JSON.stringify({ estimated_amount: 10 }));
    }
    return path.includes('usdttrc20')
      ? new Response('{}', { status: 500 })
      : new Response(JSON.stringify({ min_amount: 4 }));
  });
  const result = await new NowPayments({ ...config, currencies: ['usdttrc20', 'usdtbsc'] }).networkMinimums();
  expect(maximum).toBe(1);
  expect(result[0].available).toBe(false);
  expect(result[1].available).toBe(true);
});
