// Exercise actual buffered browser metrics with analytics delivery blocked.
const assert = require('node:assert/strict');
const path = require('node:path');
const express = require('express');
const puppeteer = require('puppeteer');

(async () => {
  const dist = path.resolve(__dirname, '../dist');
  const server = express()
    .use(express.static(dist))
    .use((req, res) => res.sendFile(path.join(dist, 'index.html')))
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
    await page.setRequestInterception(true);
    page.on('request', (request) => (request.url().startsWith(origin) ? request.continue() : request.abort()));
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin + '/zh-tw/?test_secret=never-send#private-fragment', { waitUntil: 'networkidle0' });
    // A real interaction finalizes LCP without faking PerformanceObserver entries.
    await page.click('.lobby-intro');
    await page.waitForFunction(() =>
      window.dataLayer?.some((args) => args[0] === 'event' && args[1] === 'web_vital' && args[2].metric_name === 'LCP'),
    );
    const events = await page.evaluate(() =>
      window.dataLayer.filter((args) => args[0] === 'event' && args[1] === 'web_vital').map((args) => args[2]),
    );
    const lcp = events.find((event) => event.metric_name === 'LCP');
    assert.ok(lcp.metric_value > 0);
    assert.equal(lcp.page_locale, 'zh-tw');
    assert.equal(lcp.page_location, 'https://avalon-game.com/zh-tw/');
    assert.ok(events.some((event) => event.metric_name === 'TTFB'));
    assert.doesNotMatch(JSON.stringify(events), /test_secret|never-send|private-fragment/);
    assert.ok(events.every((event) => Object.keys(event).length <= 25));
    assert.equal(await page.$eval('.hero-art', (element) => getComputedStyle(element).display), 'none');

    // Simulate a persisted pageshow to exercise listener ordering with the real
    // library: its restored TTFB callback runs synchronously in the capture phase.
    const restored = await page.evaluate(() => {
      history.pushState({}, '', '/wiki/rules/');
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
      return window.dataLayer
        .filter(
          (args) =>
            args[1] === 'web_vital' &&
            args[2].metric_name === 'TTFB' &&
            args[2].navigation_type === 'back-forward-cache',
        )
        .map((args) => args[2]);
    });
    assert.equal(restored.length, 1);
    assert.equal(restored[0].page_route, 'rules');
    assert.equal(restored[0].page_location, 'https://avalon-game.com/wiki/rules/');

    await page.goto(origin + '/password-recovery/#secret', { waitUntil: 'networkidle0' });
    assert.equal(await page.evaluate(() => window.dataLayer?.filter((args) => args[1] === 'web_vital').length || 0), 0);
    await page.goto(origin + '/profile/', { waitUntil: 'networkidle0' });
    assert.equal(await page.evaluate(() => window.dataLayer?.filter((args) => args[1] === 'web_vital').length || 0), 0);
    assert.deepEqual(errors, []);
    console.log(
      `Web Vitals browser checks passed: ${events.map((event) => event.metric_name).join(', ')}, sanitized URL, private/recovery exclusion.`,
    );
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
