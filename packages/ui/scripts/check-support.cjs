const assert = require('node:assert/strict');
const path = require('node:path');
const express = require('express');
const puppeteer = require('puppeteer');
const jsQR = require('jsqr');

// Production UI against local fixtures: no real blockchain requests or wallet operations.
const networks = [
  {
    id: 'btc',
    label: 'BTC · Bitcoin',
    asset: 'BTC',
    decimals: 8,
    address: 'bc1qn63r5d5qd0rnq7l9v2kp75rx9c5jsh9m22v09ru9dy3t3hutt8zqksv2nv',
  },
  {
    id: 'tron',
    label: 'USDT · TRON (TRC20)',
    asset: 'USDT',
    decimals: 6,
    address: 'TLmpR98uorxHmAULuG5JwDpaxKv7j5Zmvq',
    contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  },
  {
    id: 'eth',
    label: 'USDT · Ethereum (ERC20)',
    asset: 'USDT',
    decimals: 6,
    address: '0xE37cA64A14dD8e92929B7E71f3DA32267Da5969a',
    contract: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  },
  {
    id: 'bsc',
    label: 'Binance-Peg USDT · BNB Smart Chain (BEP20)',
    asset: 'USDT',
    decimals: 18,
    address: '0xE37cA64A14dD8e92929B7E71f3DA32267Da5969a',
    contract: '0x55d398326f99059ff775485246999027b3197955',
  },
];
const app = express();
app.use(express.json());
let submitted;
let responseStatus = 'confirming';
let unavailable = false;
let account = { totalUSD: 0, premium: false, hideSupport: false, showPremiumBadge: true, orders: [] };
app.get('/api/support', (_req, res) =>
  res.json({
    enabled: true,
    provider: 'direct',
    networks: unavailable ? networks.filter((n) => n.id !== 'eth') : networks,
    thresholdUSD: 10,
    donations: [],
  }),
);
app.get('/api/support/me', (_req, res) => res.json(account));
app.post('/api/support/transfers', (req, res) => {
  submitted = req.body;
  if (responseStatus === 'duplicate') return res.status(409).json({ error: 'already_claimed' });
  const payment = {
    id: '00000000-0000-4000-8000-000000000001',
    status: responseStatus,
    network: req.body.network,
    asset: 'USDT',
    txid: req.body.txid,
    createdAt: new Date().toISOString(),
    amountUSD: responseStatus === 'finished' ? 12.34 : 0,
    ...(responseStatus === 'finished' ? { amountCrypto: '12.345678' } : {}),
  };
  account = { ...account, totalUSD: payment.amountUSD, premium: payment.status === 'finished', orders: [payment] };
  res.json(payment);
});
app.post('/api/support/orders/:id/refresh', (_req, res) => res.json(account.orders[0]));
app.patch('/api/support/privacy', (_req, res) => res.json({ ok: true }));
app.use(express.static(path.resolve(__dirname, '../dist')));
app.get('*', (_req, res) => res.sendFile(path.resolve(__dirname, '../dist/index.html')));
(async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  let browser;
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await puppeteer.launch({
      headless: true,
      ...(process.env.AVALON_BUILD_CONTAINER === '1' ? { args: ['--no-sandbox'] } : {}),
    });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setRequestInterception(true);
    page.on('request', (req) => (req.url().startsWith(origin) ? req.continue() : req.abort()));
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem(
        '__user-profile__',
        JSON.stringify({
          id: 'fixture-user',
          name: 'Tester',
          login: 'tester',
          avatar: 'servant',
          token: 'fixture-token',
        }),
      );
    });
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${origin}/ru/support/`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#support-txid');
    assert.equal(await page.$eval('#support-address', (el) => el.value), networks[0].address);
    assert.equal(await page.$$eval('.network-icon', (els) => els.length), 1);
    await page.click('[aria-controls="support-qr"]');
    await page.waitForSelector('#support-qr canvas');
    async function decodedAddress() {
      const pixels = await page.$eval('#support-qr canvas', (el) => ({
        data: Array.from(el.getContext('2d').getImageData(0, 0, el.width, el.height).data),
        width: el.width,
        height: el.height,
      }));
      return jsQR(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height)?.data;
    }
    assert.equal(await decodedAddress(), networks[0].address);
    for (const item of networks.slice(1)) {
      await page.select('#support-network', item.id);
      assert.equal(await decodedAddress(), item.address);
      assert.equal(await page.$eval('#support-qr strong', (el) => el.textContent), item.label);
    }
    await page.select('#support-network', 'btc');
    if (process.env.SUPPORT_SCREENSHOT_DIR) {
      await page.$eval('#support-checkout', (el) => el.scrollIntoView());
      await (
        await page.$('#support-checkout')
      ).screenshot({ path: path.join(process.env.SUPPORT_SCREENSHOT_DIR, 'support-qr-mobile.png') });
    }
    assert.equal(await page.$eval('.primary', (el) => el.disabled), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.setViewport({ width: 320, height: 844 });
    assert.equal(
      await page.$eval('#support-address', (el) => el.scrollHeight <= el.clientHeight),
      true,
      'entire BTC address must be visible',
    );
    await page.setViewport({ width: 390, height: 844 });
    await page.select('#support-network', 'eth');
    assert.equal(await page.$eval('#support-address', (el) => el.value), networks[2].address);
    assert.equal(
      await page.$eval('#support-address', (el) => el.scrollHeight <= el.clientHeight),
      true,
      'entire USDT address must be visible',
    );
    assert.equal(await decodedAddress(), networks[2].address);
    assert.match(await page.$eval('#support-qr', (el) => el.textContent), /Ethereum/);
    await page.click('[aria-controls="support-qr"]');
    assert.equal(await page.$('#support-qr'), null);
    await page.type('#support-txid', networks[2].address);
    assert.equal(
      await page.$eval('.primary', (el) => el.disabled),
      true,
      'wallet address must not pass txid validation',
    );
    await page.$eval('#support-txid', (el) => {
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const txid = '0x' + 'ab'.repeat(32);
    await page.type('#support-txid', txid);
    await page.waitForFunction(() => !document.querySelector('.primary').disabled);
    await page.click('.primary');
    await page.waitForSelector('.orders li');
    assert.deepEqual(submitted, { network: 'eth', txid, anonymous: true });
    assert.equal(await page.$eval('.orders', (el) => el.textContent.includes('$0.00')), false);
    await page.waitForFunction(() => !document.querySelector('.primary').disabled);
    responseStatus = 'finished';
    await page.click('.primary');
    await page.waitForFunction(() => document.querySelector('.orders').textContent.includes('12.345678 USDT'));
    assert.equal(await page.$eval('.orders', (el) => el.textContent.includes('$12.34')), true);
    await page.waitForFunction(() => !document.querySelector('.primary').disabled);
    responseStatus = 'duplicate';
    await page.click('.primary');
    await page.waitForSelector('#support-checkout .error');
    assert.match(await page.$eval('#support-checkout .error', (el) => el.textContent), /уже учтён/);
    // Health filtering must explain the unavailable selection without silently changing the recipient network.
    unavailable = true;
    await page.click('.order-actions button').catch(() => {});
    await page.$eval('.account form', (el) =>
      el.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
    );
    await page.waitForSelector('#support-network option:disabled');
    assert.equal(await page.$eval('#support-network', (el) => el.value), 'eth');
    assert.equal(await page.$eval('.primary', (el) => el.disabled), true);
    await page.select('#support-network', 'bsc');
    assert.equal(await page.$eval('#support-address', (el) => el.value), networks[3].address);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.evaluate(() => scrollTo(0, 0));
    if (process.env.SUPPORT_SCREENSHOT_DIR)
      await page.screenshot({
        path: path.join(process.env.SUPPORT_SCREENSHOT_DIR, 'support-mobile.png'),
        fullPage: true,
      });
    await page.setViewport({ width: 1280, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.evaluate(() => scrollTo(0, 0));
    if (process.env.SUPPORT_SCREENSHOT_DIR)
      await page.screenshot({
        path: path.join(process.env.SUPPORT_SCREENSHOT_DIR, 'support-desktop.png'),
        fullPage: true,
      });
    assert.deepEqual(errors, []);
    console.log(
      'Support UI passed: network/recipient, txid validation, pending and credited amounts, duplicate error, unavailable network and mobile/desktop layout.',
    );
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
