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
      window.__initialHero = Array.from(document.querySelectorAll('.lobby-hero h1, .lobby-intro, .info-page-content h1, .info-page-content p'))
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
      const analyticsLoaded = Promise.all([
        page.waitForRequest((request) => request.url().includes('googletagmanager.com/gtag/js')),
        page.waitForRequest((request) => request.url().includes('mc.yandex.ru/metrika/tag.js')),
      ]);
      await page.goto(origin + pathname, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => document.querySelector('#app').__vue_app__);
      await analyticsLoaded;
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
      const guide = await page.evaluate(() => {
        const panel = document.querySelector('.lobby-guide');
        const answers = [...panel.querySelectorAll('details')];
        const social = document.querySelector('.social-card');
        return {
          answers: answers.length,
          readable: answers.every((answer) => answer.querySelector('p')?.textContent.trim().length > 40),
          closed: answers.every((answer) => !answer.open),
          socialCount: document.querySelectorAll('.social-card').length,
          socialAfter: Boolean(panel.compareDocumentPosition(social) & Node.DOCUMENT_POSITION_FOLLOWING),
        };
      });
      assert.deepEqual(guide, { answers: 4, readable: true, closed: true, socialCount: 1, socialAfter: true });
      const summary = await page.$('.lobby-guide summary');
      await summary.focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.$eval('.lobby-guide details', (node) => node.open), true, 'FAQ opens from keyboard');
      await page.keyboard.press('Enter');
      assert.equal(await page.$eval('.lobby-guide details', (node) => node.open), false, 'FAQ closes from keyboard');
      if (pathname === '/') {
        await page.setViewport({ width: 390, height: 844 });
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
          'Mobile lobby must not overflow horizontally',
        );
        // Keep the target clear of the visitor-language suggestion at the viewport bottom.
        await page.$eval('.guide-start button', (button) => button.scrollIntoView({ block: 'center' }));
        await page.click('.guide-start button');
        await page.waitForSelector('.v-overlay--active input[type="password"]', { visible: true });
        await page.setViewport({ width: 1280, height: 900 });
      }
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
    await page.evaluate(() =>
      localStorage.setItem('__user-settings__', JSON.stringify({ locale: { value: 'ru', isDefault: false } })),
    );
    for (const { pathname, language, prefix } of [
      '/guides/social-deduction-games-online/',
      '/guides/games-like-secret-hitler/',
      '/guides/avalon-vs-werewolf/',
    ].flatMap((path) =>
      [
        ['en', ''],
        ['ru', '/ru'],
        ['es', '/es'],
        ['pt', '/pt'],
        ['zh-CN', '/zh-cn'],
        ['zh-TW', '/zh-tw'],
      ].map(([language, prefix]) => ({ pathname: prefix + path, language, prefix })),
    )) {
      await page.goto(origin + pathname, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => document.querySelector('#app').__vue_app__);
      const content = await page.evaluate(() => ({
        count: window.__initialHero.length,
        retained: window.__initialHero.every(
          ({ node, firstChild, text }) =>
            document.querySelector('#app').contains(node) &&
            node.firstChild === firstChild &&
            node.textContent === text,
        ),
      }));
      assert(content.count > 3, `${pathname}: missing prerendered guide text`);
      assert.equal(content.retained, true, `${pathname}: hydration replaced guide text`);
      assert.equal(await page.$eval('.guide-page', (node) => node.lang), language, pathname);
      if (await page.$('.language-suggestion a')) {
        assert.equal(
          await page.$eval('.language-suggestion a', (link) => new URL(link.href).pathname),
          '/ru' + pathname.replace(/^\/(?:ru|es|pt|zh-cn|zh-tw)(?=\/)/, ''),
          'Suggestion keeps the same translated article',
        );
        await page.locator('.language-suggestion button').click();
      }
      await page.setViewport({ width: 390, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, pathname);
      await page.locator(`.guide-page a[href="${prefix}/#play-with-ai"]`).click();
      await page.waitForFunction(() => {
        const launch = document.querySelector('#play-with-ai .bot-room-button');
        const top = document.querySelector('#play-with-ai')?.getBoundingClientRect().top;
        return (
          location.pathname.endsWith('/') &&
          !location.pathname.includes('/guides/') &&
          location.hash === '#play-with-ai' &&
          launch &&
          top !== undefined &&
          Math.abs(top - 80) < 3
        );
      });
      await page.waitForSelector('#play-with-ai .bot-room-button', { visible: true });
      assert.equal(new URL(page.url()).pathname, prefix + '/', 'Bot CTA keeps article locale');
      await page.setViewport({ width: 1280, height: 900 });
      if (pathname === '/guides/avalon-vs-werewolf/') {
        await page.evaluate(async (route) => {
          await document.querySelector('#app').__vue_app__.config.globalProperties.$router.replace({
            path: route,
            query: { ref: 'menu-check' },
            hash: '#comparison',
          });
        }, pathname);
        await page.click('.menu-trigger');
        await page.waitForSelector('.v-overlay--active .language-trigger', { visible: true });
        // The dialog is visible during its enter animation, while its content
        // still ignores pointer events. Wait for a stable button before clicking.
        await page.locator('.v-overlay--active .language-trigger').click();
        await page.waitForSelector('.v-overlay--active .language-links a', { visible: true });
        const languageLinks = await page.$$eval('.v-overlay--active .language-links a', (links) =>
          Object.fromEntries(
            links.map((link) => [
              link.lang,
              new URL(link.href).pathname + new URL(link.href).search + new URL(link.href).hash,
            ]),
          ),
        );
        assert.deepEqual(languageLinks, {
          en: '/guides/avalon-vs-werewolf/?ref=menu-check#comparison',
          ru: '/ru/guides/avalon-vs-werewolf/?ref=menu-check#comparison',
          'zh-TW': '/zh-tw/guides/avalon-vs-werewolf/?ref=menu-check#comparison',
          'zh-CN': '/zh-cn/guides/avalon-vs-werewolf/?ref=menu-check#comparison',
          es: '/es/guides/avalon-vs-werewolf/?ref=menu-check#comparison',
          pt: '/pt/guides/avalon-vs-werewolf/?ref=menu-check#comparison',
        });
        await page.click('.v-overlay--active .language-links a[lang="ru"]');
        await page.waitForFunction(
          () =>
            location.pathname === '/ru/guides/avalon-vs-werewolf/' &&
            location.hash === '#comparison' &&
            document.querySelector('.guide-page')?.lang === 'ru',
        );
      }
      assert.deepEqual(pageErrors, [], `Uncaught errors while hydrating ${pathname}`);
    }
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
      '/ru/community/players/',
      '/ru/community/groups/',
      '/ru/support/',
      '/guides/social-deduction-games-online/',
      '/guides/games-like-secret-hitler/',
      '/guides/avalon-vs-werewolf/',
      '/es/guides/avalon-vs-werewolf/',
      '/pt/guides/avalon-vs-werewolf/',
      '/zh-cn/guides/games-like-secret-hitler/',
      '/zh-tw/guides/games-like-secret-hitler/',
      '/ru/guides/social-deduction-games-online/',
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
        // Exercise repeated placeholders deliberately, independent of editorial
        // changes to the article. Restore the real copy before later checks.
        const originalDescription = await page.evaluate(async () => {
          const app = document.querySelector('#app').__vue_app__;
          const i18n = app._context.provides[app.__VUE_I18N_SYMBOL__].global;
          const original = i18n.getLocaleMessage('ru').rules.additionalObjectivesDescription;
          i18n.mergeLocaleMessage('ru', {
            rules: { additionalObjectivesDescription: '{merlin} и {merlin}' },
          });
          await new Promise((resolve) => requestAnimationFrame(resolve));
          return original;
        });
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
        await page.evaluate(async (description) => {
          const app = document.querySelector('#app').__vue_app__;
          const i18n = app._context.provides[app.__VUE_I18N_SYMBOL__].global;
          i18n.mergeLocaleMessage('ru', { rules: { additionalObjectivesDescription: description } });
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }, originalDescription);
      }
      if (pathname === '/') {
        assert.match(await page.$eval('.support-card', (el) => new URL(el.href).pathname), /\/support\/$/);
        assert.deepEqual(
          await page.$$eval('.play-with-card a', (links) => links.map((link) => new URL(link.href).pathname)),
          ['/community/groups/', '/community/players/', '/community/'],
          'Lobby search links must open the relevant listings directly and keep the community directory available',
        );
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
            (route.includes('/wiki/') || route.includes('/community/') || route.includes('/guides/')
              ? JSON.parse(crumbs)['@id'] === node.breadcrumb['@id']
              : crumbs === '')
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
          { ru: 'ru', es: 'es', pt: 'pt', 'zh-cn': 'zh-CN', 'zh-tw': 'zh-TW' }[pathname.split('/')[1]] || 'en',
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
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(origin + '/zh-tw/wiki/rules/#faq', { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => {
      const top = document.querySelector('#faq')?.getBoundingClientRect().top;
      return top !== undefined && Math.abs(top - 80) < 3;
    });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
      'Mobile rules and FAQ must not overflow horizontally',
    );
    // Earlier navigation sets a Russian preference; dismiss its language banner
    // before testing the Chinese page's bottom CTA on a narrow viewport.
    if (await page.$('.language-suggestion button')) {
      await page.click('.language-suggestion button');
      await page.waitForSelector('.language-suggestion', { hidden: true });
    }
    await page.locator('.wiki-play-cta .play-link').click();
    await page.waitForFunction(() => location.pathname === '/zh-tw/' && document.querySelector('.lobby'));
    assert.deepEqual(pageErrors, [], 'Mobile FAQ and play CTA must navigate without errors');
    console.log('Mobile FAQ fragment and localized play CTA OK');

    const editorRequests = [];
    page.on('request', (request) => {
      if (/options-dialog\.[^/]+\.js$/.test(new URL(request.url()).pathname)) editorRequests.push(request.url());
    });
    await page.goto(origin + '/ru/wiki/rules/', { waitUntil: 'networkidle0' });
    assert.equal(editorRequests.length, 0, 'Rules must not download the editor before it is opened');
    await page.locator('[data-load-role-options]').click();
    await page.waitForSelector('.v-overlay--active .options', { visible: true });
    assert.equal(editorRequests.length, 1, 'First click loads and opens the role editor');
    await page.locator('.v-overlay--active .options-header button').click();
    await page.waitForSelector('.v-overlay--active .options', { hidden: true });
    await page.waitForFunction(() => document.querySelector('.rules-role-options button') === document.activeElement);
    await page.locator('.rules-role-options button').click();
    await page.waitForSelector('.v-overlay--active .options', { visible: true });
    assert.equal(editorRequests.length, 1, 'Reopening reuses the loaded editor');
    assert.deepEqual(pageErrors, [], 'Lazy role editor must open without navigation or hydration errors');
    console.log('Rules role editor loads on demand and opens from the first click');
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
