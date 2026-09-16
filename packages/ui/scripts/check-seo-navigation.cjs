const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const puppeteer = require('puppeteer');
const root = path.resolve(__dirname, '../dist');
const server = http.createServer((req, res) => {
  let file = path.join(root, new URL(req.url, 'http://localhost').pathname);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) file = path.join(root, 'index.html');
  const mime = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
  };
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await puppeteer.launch({
      headless: true,
      // Docker BuildKit cannot provide Chromium's sandbox. This check only loads
      // our local build; external requests are blocked below. Keep local defaults.
      ...(process.env.AVALON_BUILD_CONTAINER === '1' ? { args: ['--no-sandbox'] } : {}),
    });
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => (req.url().startsWith(origin) ? req.continue() : req.abort()));
    await page.goto(origin, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.querySelector('#app').__vue_app__);
    for (const pathname of ['/ru/wiki/rules/', '/ru/wiki/roles/merlin/', '/ru/about/', '/leaderboard/', '/']) {
      await page.evaluate(async (route) => {
        const router = document.querySelector('#app').__vue_app__.config.globalProperties.$router;
        await router.push(route);
        // Let Vue finish mounting/unmounting before checking for late cleanup.
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }, pathname);
      await page.waitForFunction(
        (route) => {
          const raw = document.querySelector('#page-structured-data').textContent;
          const crumbs = document.querySelector('#breadcrumb-structured-data').textContent;
          if (route === '/leaderboard/') return raw === '' && crumbs === '';
          const node = JSON.parse(raw)['@graph'].find((n) => n['@type'] === 'WebPage');
          return (
            node.url === 'https://avalon-game.com' + route &&
            (route.includes('/wiki/') ? JSON.parse(crumbs)['@id'] === node.breadcrumb['@id'] : crumbs === '')
          );
        },
        {},
        pathname,
      );
      const state = await page.evaluate(() => ({
        canonical: document.querySelector('link[rel=canonical]').href,
        graph: document.querySelector('#page-structured-data').textContent,
        robots: document.querySelector('meta[name=robots]').content,
      }));
      assert.equal(state.canonical, 'https://avalon-game.com' + pathname);
      if (pathname === '/leaderboard/') assert.equal(state.robots, 'noindex, follow');
      else
        assert.equal(
          JSON.parse(state.graph)['@graph'].find((n) => n['@type'] === 'WebPage').inLanguage,
          pathname.startsWith('/ru/') ? 'ru' : 'en',
        );
      console.log('SPA structured data OK:', pathname);
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
