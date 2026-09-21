// Production-browser regression: a click on prerendered UI must survive JS loading.
const assert = require('node:assert/strict');
const path = require('node:path');
const express = require('express');
const puppeteer = require('puppeteer');
(async () => {
  const server = express()
    .use(express.static(path.resolve(__dirname, '../dist')))
    .listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      ...(process.env.AVALON_BUILD_CONTAINER === '1' ? { args: ['--no-sandbox'] } : {}),
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    await page.evaluateOnNewDocument(() => Object.defineProperty(navigator, 'languages', { get: () => ['en'] }));
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (/hydration.*mismatch/i.test(message.text())) errors.push(message.text());
    });
    let holdScripts = true;
    const held = [];
    const requested = [];
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url();
      requested.push(url);
      if (!url.startsWith(origin)) return request.abort();
      if (holdScripts && new URL(url).pathname.startsWith('/js/')) held.push(request);
      else request.continue();
    });
    const navigation = page.goto(origin, { waitUntil: 'domcontentloaded' });
    navigation.catch(() => {});
    await page.waitForSelector('.create-room', { visible: true });
    assert.ok(!requested.some((url) => url.includes('auth-dialog.')), 'login chunk must not load before opening');
    await page.click('.create-room');
    assert.equal(
      await page.$eval('.create-room', (button) => button.getAttribute('aria-busy')),
      'true',
      'early click must expose a pending state',
    );
    holdScripts = false;
    await Promise.all(held.map((request) => request.continue()));
    await navigation;
    await page.waitForSelector('.modal-overlay input', { visible: true });
    assert.equal(
      await page.$$eval(
        '.modal-overlay input',
        (inputs) => inputs.filter((input) => input.getBoundingClientRect().width > 0).length,
      ),
      2,
      'first click opens login once',
    );
    assert.equal(await page.$eval('.create-room', (button) => button.hasAttribute('aria-busy')), false);
    await page.click('.modal-overlay .close-btn');
    await page.waitForFunction(
      () =>
        ![...document.querySelectorAll('.modal-overlay input')].some((input) => input.getBoundingClientRect().width),
    );
    await page.click('.create-room');
    await page.waitForSelector('.modal-overlay input', { visible: true });
    requested.length = 0;
    await page.goto(origin + '/wiki/rules/', { waitUntil: 'networkidle0' });
    assert.equal(await page.$eval('h1', (h1) => Boolean(h1.textContent.trim())), true);
    assert.ok(
      !requested.some((url) => /\/(?:lobby|auth-dialog|credentials-dialog)\./.test(url)),
      'articles must not fetch lobby or account dialogs',
    );
    requested.length = 0;
    holdScripts = true;
    held.length = 0;
    const supportNavigation = page.goto(origin + '/support/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.support-benefits > summary');
    assert.ok(
      !requested.some((url) => /(?:puppeteer|eclipse-queen|mordred-puppet|morgana-violin)\.[a-f0-9]+\.webp/.test(url)),
      'closed benefits must not fetch premium media',
    );
    await page.focus('.support-benefits > summary');
    await page.keyboard.press('Enter');
    assert.equal(await page.$eval('.support-benefits', (details) => details.open), true);
    holdScripts = false;
    await Promise.all(held.map((request) => request.continue()));
    await supportNavigation;
    await page.waitForFunction(() => document.querySelectorAll('.premium-collection img').length === 4);
    await page.focus('.support-benefits > summary');
    await page.keyboard.press('Enter');
    assert.equal(
      await page.$$eval('.premium-collection img', (images) => images.length),
      4,
      'closing retains mounted images',
    );
    assert.deepEqual(errors, []);
    console.log(
      'Startup checks passed: queued early click, lazy login close/reopen, article isolation and pre-hydration premium disclosure.',
    );
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
