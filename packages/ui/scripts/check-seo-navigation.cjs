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
  if (path.extname(file) === '.html') {
    // Runs after HTML parsing but before the deferred app bundle. Keep the
    // actual painted nodes so a client remount cannot pass as hydration.
    const capture = `<script>
      window.__initialHero = Array.from(document.querySelectorAll('.lobby-hero h1, .lobby-intro'))
        .map(node => ({ node, firstChild: node.firstChild, text: node.textContent }));
    </script>`;
    res.end(fs.readFileSync(file, 'utf8').replace('</body>', `${capture}</body>`));
    return;
  }
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
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.stack || error.message));
    page.on('console', (message) => {
      if (/hydration.*mismatch/i.test(message.text())) {
        pageErrors.push(message.text());
      }
    });
    await page.setRequestInterception(true);
    let analyticsRequests = [];
    page.on('request', (req) => {
      if (/googletagmanager\.com\/gtag\/js|mc\.yandex\.ru\/metrika\/tag\.js/.test(req.url())) {
        analyticsRequests.push(req.url());
      }
      return req.url().startsWith(origin) ? req.continue() : req.abort();
    });
    for (const pathname of ['/', '/zh-tw/', '/ru/', '/es/', '/pt/', '/zh-cn/']) {
      analyticsRequests = [];
      await page.goto(origin + pathname, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => document.querySelector('#app').__vue_app__);
      assert.equal(
        analyticsRequests.filter((url) => url.includes('googletagmanager')).length,
        1,
        `${pathname}: Google tag requests`,
      );
      assert.equal(
        analyticsRequests.filter((url) => url.includes('mc.yandex')).length,
        1,
        `${pathname}: Metrika requests`,
      );
      const hero = await page.evaluate(() => ({
        count: window.__initialHero.length,
        retained: window.__initialHero.every(
          ({ node, firstChild, text }) =>
            document.querySelector('#app').contains(node) &&
            node.firstChild === firstChild &&
            node.textContent === text,
        ),
      }));
      assert.equal(hero.count, 2, `${pathname}: missing prerendered hero`);
      assert.equal(hero.retained, true, `${pathname}: startup replaced the painted LCP text`);
      assert.deepEqual(pageErrors, [], `Uncaught errors while hydrating ${pathname}`);
      console.log('Lobby LCP nodes retained:', pathname);
    }
    // Returning visitors hydrate the anonymous HTML first, then restore their
    // preferences without replacing the hero or switching its URL language.
    await page.evaluate(() =>
      localStorage.setItem(
        '__user-settings__',
        JSON.stringify({
          colorTheme: 'dark',
          locale: { value: 'ru', isDefault: false },
        }),
      ),
    );
    await page.goto(origin + '/zh-tw/', { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.querySelector('#app').__vue_app__);
    assert.deepEqual(
      await page.evaluate(() => {
        const globals = document.querySelector('#app').__vue_app__.config.globalProperties;
        return {
          darkTheme: document.querySelector('.create-room').classList.contains('v-theme--darkTheme'),
          preference: globals.$store.state.settings.colorTheme,
          language: document.documentElement.lang,
          retained: window.__initialHero.every(
            ({ node, firstChild, text }) =>
              document.querySelector('#app').contains(node) &&
              node.firstChild === firstChild &&
              node.textContent === text,
          ),
        };
      }),
      { darkTheme: true, preference: 'dark', language: 'zh-TW', retained: true },
    );
    await page.click('.create-room');
    await page.waitForSelector('.v-overlay--active input[type="password"]', { visible: true });
    assert.deepEqual(pageErrors, [], 'Hydration/preferences must preserve working login controls');
    await page.evaluate(() => localStorage.clear());
    await page.goto(origin, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.querySelector('#app').__vue_app__);
    for (const pathname of [
      '/leaderboard/',
      '/',
      '/ru/wiki/rules/',
      '/ru/wiki/roles/merlin/',
      '/ru/about/',
      '/ru/community/',
      '/ru/support/',
      '/leaderboard/',
      '/',
    ]) {
      await page.evaluate(async (route) => {
        const router = document.querySelector('#app').__vue_app__.config.globalProperties.$router;
        await router.push(route);
        // Let Vue finish mounting/unmounting before checking for late cleanup.
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }, pathname);
      // Metadata can update even when Vue fails to insert the new route's DOM.
      if (pathname === '/leaderboard/' || pathname === '/') {
        await page.waitForSelector(pathname === '/leaderboard/' ? '.leaderboard-page' : '.lobby');
      }
      if (pathname === '/ru/community/') await page.waitForSelector('.community-page');
      if (pathname === '/ru/support/') await page.waitForSelector('.support-page');
      if (pathname === '/ru/wiki/rules/') {
        await page.waitForSelector('.rules');
        assert.equal(
          await page.$eval('.rules', (rules) =>
            Array.from(rules.querySelectorAll('p')).some((paragraph) => {
              const links = paragraph.querySelectorAll('a[href="/ru/wiki/roles/merlin/"]');
              return links.length === 2 && Array.from(links).every((link) => link.textContent.trim() === 'Мерлин');
            }),
          ),
          true,
          'Repeated translated placeholders must render two independent, localized links',
        );
        assert.doesNotMatch(await page.$eval('.rules', (rules) => rules.textContent), /\u0001/);
      }
      if (pathname === '/') {
        assert.match(await page.$eval('.support-card', (el) => new URL(el.href).pathname), /\/support\/$/);
        assert.match(await page.$eval('.discord-card', (el) => new URL(el.href).pathname), /\/community\/$/);
      }
      assert.deepEqual(pageErrors, [], `Uncaught errors while navigating to ${pathname}`);
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
    await page.goto(origin + '/zh-tw/wiki/rules/#mission-sizes', { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => {
      const top = document.querySelector('#mission-sizes')?.getBoundingClientRect().top;
      return top !== undefined && Math.abs(top - 80) < 3;
    });
    await page.click('.rules-contents a[href="#winning"]');
    await page.waitForFunction(() => {
      const top = document.querySelector('#winning')?.getBoundingClientRect().top;
      return location.hash === '#winning' && top !== undefined && Math.abs(top - 80) < 3;
    });
    assert.deepEqual(pageErrors, [], 'Rules anchors must not cause hydration or navigation errors');
    console.log('Rules direct fragment and table of contents scrolling OK');
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
