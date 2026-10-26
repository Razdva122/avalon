// Exercise the production artifact: actual chunk requests, pointer input, persistence and keyboard scope.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const puppeteer = require('puppeteer');
(async () => {
  const app = express();
  const server = require('node:http').createServer(app);
  const dist = path.resolve(__dirname, '../dist');
  const fixture = require('./fixtures/playground-room.cjs')(app, server, dist);
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  server.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      ...(process.env.AVALON_BUILD_CONTAINER === '1' ? { args: ['--no-sandbox'] } : {}),
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument((profile) => {
      Object.defineProperty(navigator, 'languages', { get: () => ['ru'] });
      localStorage.setItem('__user-profile__', JSON.stringify({ ...profile, token: 'local-preview' }));
      if (!localStorage.getItem('__user-settings__'))
        localStorage.setItem(
          '__user-settings__',
          JSON.stringify({ locale: { value: 'ru', isDefault: false }, colorTheme: 'light' }),
        );
    }, fixture.profile);
    const errors = [],
      requests = [];
    let holdGame = false;
    const heldGameRequests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      requests.push(request.url());
      if (holdGame && /playground-2048[.].*\.js/.test(request.url())) {
        heldGameRequests.push(request);
        return;
      }
      if (!request.url().startsWith(origin)) request.abort();
      else request.continue();
    });
    const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('avalon.playground.2048.v1')));
    const seed = async (rows, extra = {}) =>
      page.evaluate(
        ({ rows, extra }) => {
          localStorage.setItem(
            'avalon.playground.2048.v1',
            JSON.stringify({
              version: 1,
              score: 0,
              best: 120,
              nextID: 17,
              continued: false,
              tiles: rows.flatMap((row, r) =>
                row.flatMap((value, c) => (value ? [{ id: r * 4 + c + 1, value, row: r, col: c }] : [])),
              ),
              ...extra,
            }),
          );
        },
        { rows, extra },
      );
    const open = async () => {
      // An exiting menu scrim can still cover the header after its content is hidden.
      await page.waitForFunction(() => {
        const button = document.querySelector('.playground-launcher');
        if (!button || button.disabled) return false;
        const r = button.getBoundingClientRect();
        return (
          document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('.playground-launcher') === button
        );
      });
      await page.click('.playground-launcher');
      await page.waitForSelector('.playground-picker', { visible: true });
      await page.waitForFunction(() => document.activeElement === document.querySelector('.playground-game-2048'));
      await page.locator('.playground-game-2048').click();
      await page.waitForSelector('.puzzle-2048-board', { visible: true });
      await page.waitForFunction(() => document.activeElement === document.querySelector('.puzzle-2048-board'));
      await page.waitForFunction(() => {
        const content = document.querySelector('.playground-panel')?.closest('.v-overlay__content');
        return (
          content && !content.getAnimations({ subtree: true }).some((animation) => animation.playState === 'running')
        );
      });
    };
    const close = async () => {
      await page.click('.playground-game-close');
      await page.waitForSelector('.playground-panel', { hidden: true });
    };
    await page.goto(`${origin}/room/playground-preview/`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.playground-launcher');
    assert.ok(
      !requests.some((url) => /playground-2048[.]/.test(url)),
      '2048 JS and CSS must not be fetched before opening',
    );
    assert.equal(
      await page.$('.header .playground-launcher'),
      null,
      'playground is a room tool, not header navigation',
    );
    const dock = await page.$eval('.playground-launcher', (button) => {
      const voice = document.querySelector('.voice-launcher').getBoundingClientRect();
      const game = button.getBoundingClientRect();
      return { voiceRight: voice.right, gameLeft: game.left, voiceY: voice.y, gameY: game.y };
    });
    assert.ok(
      dock.gameLeft >= dock.voiceRight && Math.abs(dock.voiceY - dock.gameY) < 5,
      'gamepad sits to the right of voice',
    );
    await page.click('.playground-launcher');
    await page.waitForSelector('.playground-picker', { visible: true });
    await page.waitForFunction(() => document.activeElement === document.querySelector('.playground-game-2048'));
    assert.equal(await page.$$('.playground-choice').then((nodes) => nodes.length), 3);
    assert.equal(await page.$$('.playground-choice:disabled').then((nodes) => nodes.length), 2);
    assert.ok(!requests.some((url) => /playground-2048[.]/.test(url)), 'opening the picker must not fetch 2048');
    assert.ok(!requests.some((url) => /runestone[.]/.test(url)), 'opening the picker must not fetch the stone texture');
    assert.ok(
      await page.$eval('.playground-picker', (panel) => panel.getBoundingClientRect().right < innerWidth / 2),
      'picker opens to the left of the table',
    );
    const screenshotDir = process.env.PLAYGROUND_SCREENSHOTS;
    if (screenshotDir) {
      fs.mkdirSync(screenshotDir, { recursive: true });
      await page.screenshot({ path: path.join(screenshotDir, 'playground-picker.png') });
    }
    await page.click('.playground-picker-close');
    await page.waitForSelector('.playground-picker', { hidden: true });
    holdGame = true;
    await page.click('.playground-launcher');
    await page.waitForFunction(() => document.activeElement === document.querySelector('.playground-game-2048'));
    const requestedGame = page.waitForRequest((request) => /playground-2048[.].*\.js/.test(request.url()));
    await page.click('.playground-game-2048');
    await requestedGame;
    await page.keyboard.press('Escape');
    await page.waitForSelector('.playground-picker', { hidden: true });
    holdGame = false;
    await Promise.all(heldGameRequests.map((request) => request.continue()));
    await page.click('.playground-launcher');
    await page.waitForFunction(() => document.activeElement === document.querySelector('.playground-game-2048'));
    await page.waitForFunction(
      () => document.querySelector('.playground-game-2048')?.getAttribute('aria-busy') === 'false',
    );
    assert.equal(await page.$('.puzzle-2048-board'), null, 'dismissed download must not open a game');
    await page.click('.playground-picker-close');
    await page.waitForSelector('.playground-picker', { hidden: true });
    assert.equal(await page.$('.puzzle-2048-board'), null, 'dismissed download must not leave a pending launch');
    await seed([[2, 2, 2, 2]]);
    await open();
    assert.ok(
      requests.some((url) => /playground-2048[.].*\.js/.test(url)),
      'opening must fetch game JS',
    );
    assert.ok(
      requests.some((url) => /playground-2048[.].*\.css/.test(url)),
      'opening must fetch game CSS',
    );
    await page.waitForFunction(() =>
      performance
        .getEntriesByType('resource')
        .some((entry) => /runestone[.]/.test(entry.name) && entry.responseEnd > 0),
    );
    assert.equal(
      requests.filter((url) => /runestone[.]/.test(url)).length,
      1,
      'all stone tiles share a single lazily loaded texture',
    );
    await page.focus('.puzzle-2048-board');
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('avalon.playground.2048.v1')).score === 8);
    // Close before the slide completes: the final board must already be durable.
    const committed = await saved();
    await page.click('.playground-back');
    await page.waitForSelector('.playground-picker', { visible: true });
    await page.waitForFunction(() => document.activeElement === document.querySelector('.playground-game-2048'));
    assert.deepEqual(await saved(), committed, 'returning to the picker preserves the board');
    await page.locator('.playground-game-2048').click();
    await page.waitForSelector('.puzzle-2048-board', { visible: true });
    await page.waitForFunction(() => document.activeElement === document.querySelector('.puzzle-2048-board'));
    await close();
    await page.keyboard.press('ArrowRight');
    assert.deepEqual(await saved(), committed, 'closed game must not intercept page keys');
    await open();
    assert.deepEqual(await saved(), committed, 'opening restores the exact board');
    assert.equal(await page.$eval('.puzzle-2048-board', (el) => getComputedStyle(el).touchAction), 'none');
    assert.ok(
      await page.$eval('#game-board-state', (el) => el.textContent.includes('4')),
      'board positions must be accessible',
    );
    await close();
    await seed([[2, 2, 4, 0]]);
    await open();
    await page.focus('.puzzle-2048-board');
    for (const key of ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft']) await page.keyboard.press(key);
    await page.waitForFunction(() => document.querySelectorAll('.tile-born').length > 0);
    await new Promise((resolve) => setTimeout(resolve, 450));
    const rapid = await saved();
    assert.ok(rapid.tiles.every((t) => t.row >= 0 && t.row < 4 && t.col >= 0 && t.col < 4));
    assert.equal(new Set(rapid.tiles.map((t) => `${t.row},${t.col}`)).size, rapid.tiles.length);
    if (screenshotDir) {
      fs.mkdirSync(screenshotDir, { recursive: true });
      await page.screenshot({ path: path.join(screenshotDir, '2048-desktop.png') });
    }
    await close();
    for (const [width, height] of [
      [1366, 768],
      [1280, 720],
      [1024, 640],
    ]) {
      await page.setViewport({ width, height });
      await seed([
        [1024, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ]);
      await open();
      const layout = await page.$eval('.playground-panel', (panel) => {
        const board = panel.querySelector('.puzzle-2048-board').getBoundingClientRect();
        return {
          scroll: panel.scrollHeight - panel.clientHeight,
          width: board.width,
          height: board.height,
          footerBottom: panel.querySelector('.playground-footer').getBoundingClientRect().bottom,
          panelBottom: panel.getBoundingClientRect().bottom,
        };
      });
      assert.ok(
        layout.scroll <= 1,
        `desktop ${width}x${height}: panel must fit without scrolling (${layout.scroll}px overflow)`,
      );
      assert.ok(Math.abs(layout.width - layout.height) <= 1, 'board stays square even with a game-over overlay');
      assert.ok(
        await page.$$eval('.tile-face > span', (numbers) =>
          numbers.every((number) => number.getBoundingClientRect().width <= number.parentElement.clientWidth),
        ),
        'tile numbers fit the compact board',
      );
      assert.ok(layout.footerBottom <= layout.panelBottom + 1, 'footer remains visible');
      if (width === 1366 && screenshotDir)
        await page.screenshot({ path: path.join(screenshotDir, '2048-desktop-compact.png') });
      await close();
    }
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await seed([[2, 2, 0, 0]]);
    await open();
    await page.waitForFunction(() => document.querySelector('.puzzle-2048-board').getBoundingClientRect().width > 200);
    const box = await page.$eval('.puzzle-2048-board', (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    const cdp = await page.createCDPSession();
    const touch = async (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
    const start = { x: box.x + box.width * 0.75, y: box.y + box.height * 0.5 };
    const end = { x: box.x + box.width * 0.25, y: start.y };
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await touch('touchStart', [start]);
    await touch('touchMove', [end]);
    await touch('touchEnd', []);
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('avalon.playground.2048.v1')).score === 4);
    assert.equal(await page.evaluate(() => window.scrollY), scrollBefore, 'swiping the board must not scroll the page');
    await new Promise((resolve) => setTimeout(resolve, 250));
    const beforeCancel = await saved();
    await touch('touchStart', [start]);
    await touch('touchCancel', []);
    assert.deepEqual(await saved(), beforeCancel, 'cancelled contact must not make a move');
    await touch('touchStart', [start]);
    await touch('touchMove', [{ x: start.x - 5, y: start.y + 3 }]);
    await touch('touchEnd', []);
    assert.deepEqual(await saved(), beforeCancel, 'a tap or small tremor must not move tiles');
    await touch('touchStart', [start]);
    await touch('touchStart', [start, { x: start.x - 30, y: start.y + 30 }]);
    await touch('touchMove', [end, { x: end.x - 30, y: end.y + 30 }]);
    await touch('touchEnd', []);
    assert.deepEqual(await saved(), beforeCancel, 'multi-touch cancels the active swipe');
    assert.ok(
      await page.$eval('.playground-panel', (el) => {
        const r = el.getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth;
      }),
      'panel fits phone width',
    );
    if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, '2048-mobile.png') });
    await close();
    await page.reload({ waitUntil: 'networkidle0' });
    await open();
    assert.deepEqual(await saved(), beforeCancel, 'page reload restores the board');
    await close();
    await page.setViewport({ width: 812, height: 375, isMobile: true, hasTouch: true });
    await open();
    assert.ok(
      await page.$eval('.playground-panel', (el) => el.clientHeight <= innerHeight),
      'landscape panel stays within viewport',
    );
    await close();
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await seed([[1024, 1024, 0, 0]]);
    await open();
    await page.focus('.puzzle-2048-board');
    await page.keyboard.press('ArrowLeft');
    await page.waitForSelector('.game-end', { visible: true });
    assert.equal((await saved()).score, 2048);
    await page.click('.game-end .game-primary');
    assert.equal((await saved()).continued, true);
    await close();
    await seed([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    await open();
    await page.waitForSelector('.game-end', { visible: true });
    await page.click('.game-end .game-primary');
    assert.equal((await saved()).tiles.length, 2);
    await close();
    await page.evaluate(() => localStorage.setItem('avalon.playground.2048.v1', '{broken'));
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await open();
    assert.equal((await saved()).tiles.length, 2, 'corrupt saves recover to a playable game');
    assert.ok(await page.$eval('.game-tile', (el) => parseFloat(getComputedStyle(el).transitionDuration) <= 0.001));
    await close();
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    await seed(
      [
        [2, 4, 8, 0],
        [16, 32, 4, 0],
        [64, 128, 256, 0],
        [512, 1024, 2048, 0],
      ],
      { score: 1520, best: 4096, continued: true },
    );
    await page.setViewport({ width: 1440, height: 1000 });
    await open();
    if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, '2048-desktop.png') });
    await close();
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await open();
    if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, '2048-mobile.png') });
    const lightBoardBackground = await page.$eval('.puzzle-2048-board', (el) => getComputedStyle(el).backgroundColor);
    await close();
    await page.click('.menu-trigger');
    await page.waitForSelector('.theme-switch', { visible: true });
    await page.locator('.theme-switch').click();
    await page.waitForFunction(() => document.querySelector('.theme-switch')?.getAttribute('aria-checked') === 'true');
    await page.click('.close-menu');
    await page.waitForFunction(() => {
      const menu = document.querySelector('.site-menu-overlay .v-overlay__content');
      return !menu || getComputedStyle(menu).display === 'none';
    });
    await open();
    const darkBackground = await page.$eval('.playground-panel', (el) => getComputedStyle(el).backgroundColor);
    assert.equal(darkBackground, 'rgb(28, 37, 50)', 'game panel follows the real theme switch');
    assert.notEqual(
      await page.$eval('.puzzle-2048-board', (el) => getComputedStyle(el).backgroundColor),
      lightBoardBackground,
      'board adapts to dark theme',
    );
    if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, '2048-mobile-dark.png') });
    await close();
    await open();
    fixture.room.game.players[0].features.waitForAction = true;
    fixture.io.emit('gameUpdated', fixture.room.game);
    await page.waitForSelector('.playground-panel', { hidden: true });
    assert.ok(
      await page.$eval('.playground-launcher', (button) => button.disabled),
      'own turn closes and disables playground',
    );
    fixture.room.game.players[0].features.waitForAction = false;
    fixture.io.emit('gameUpdated', fixture.room.game);
    await page.waitForFunction(() => !document.querySelector('.playground-launcher').disabled);
    // Storage can be denied in private contexts; play should remain available and honest about saving.
    await page.evaluate(() =>
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw Error('blocked');
        },
      }),
    );
    await open();
    assert.equal(await page.$$('.game-tile').then((list) => list.length), 2);
    assert.ok(await page.$('.save-warning'));
    assert.deepEqual(errors, []);
    console.log(
      '2048 browser checks passed: on-demand JS/CSS, compact desktop layout, keyboard, rapid input, native touch/cancel, local restore, win/loss, corrupt/blocked storage and reduced motion.',
    );
  } finally {
    await browser?.close();
    await new Promise((resolve) => fixture.io.close(resolve));
    if (server.listening) await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
