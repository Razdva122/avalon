const assert = require('node:assert/strict');
const path = require('node:path');
const express = require('express');
const puppeteer = require('puppeteer');

// Exercise the production UI with local API fixtures; never send real email.
const app = express();
app.use(express.json());
let forgotBody;
let resetBody;
app.get('/api/auth/recovery', (_req, res) => res.json({ enabled: true }));
app.post('/api/auth/forgot-password', (req, res) => {
  forgotBody = req.body;
  res.status(202).json({ ok: true });
});
app.post('/api/auth/reset-password', (req, res) => {
  resetBody = req.body;
  res.json({ ok: true });
});
app.use(express.static(path.resolve(__dirname, '../dist')));
app.get('*', (_req, res) => res.sendFile(path.resolve(__dirname, '../dist/index.html')));

(async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  let browser;
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await puppeteer.launch({
      headless: true,
      ...(process.env.AVALON_BUILD_CONTAINER === '1' ? { args: ['--no-sandbox'] } : {}),
    });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', (req) => (req.url().startsWith(origin) ? req.continue() : req.abort()));
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'languages', { get: () => ['ru-RU', 'ru'] });
    });
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${origin}/password-recovery/`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.recovery-card input[type=email]');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.type('.recovery-card input[type=email]', 'player@example.com');
    await page.click('.recovery-card button[type=submit]');
    await page.waitForSelector('.recovery-card .v-alert[role=status]');
    assert.equal(forgotBody.email, 'player@example.com');

    // This is a same-document navigation: the existing form must notice the link.
    const token = 'a'.repeat(64);
    await page.goto(`${origin}/password-recovery/#${token}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.recovery-card input[type=password]');
    assert.equal(new URL(page.url()).hash, '');
    assert.equal(await page.evaluate(() => window.__avalonRecoveryToken), undefined);
    let inputs = await page.$$('.recovery-card input[type=password]');
    await inputs[0].type('new-password');
    await inputs[1].type('different-password');
    await page.click('.recovery-card button[type=submit]');
    await page.waitForSelector('.recovery-card .v-input--error');
    assert.equal(resetBody, undefined);
    await inputs[1].click({ clickCount: 3 });
    await inputs[1].press('Backspace');
    await inputs[1].type('new-password');
    await page.click('.recovery-card button[type=submit]');
    await page.waitForSelector('.recovery-card .v-alert[role=status]');
    assert.equal(resetBody.token, token);
    assert.equal(resetBody.password, 'new-password');

    // A fresh document also consumes the early bootstrap token exactly once.
    await page.goto('about:blank');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${origin}/password-recovery/#${token}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.recovery-card input[type=password]');
    assert.equal(new URL(page.url()).hash, '');
    assert.equal(await page.evaluate(() => window.__avalonRecoveryToken), undefined);
    inputs = await page.$$('.recovery-card input[type=password]');
    assert.equal(inputs.length, 2);
    assert.deepEqual(errors, []);
    console.log(
      'Password recovery browser checks passed: mobile request, same-tab link, direct link, confirmation and reset.',
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
