// Full production UI with a local Socket.IO fixture. No production traffic.
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const puppeteer = require('puppeteer');
const root = path.resolve(__dirname, '../../..');
const dist = path.join(root, 'packages/ui/dist');
const output = process.env.AVALON_LIVE_TIPS_SCREENSHOTS || '/tmp/avalon-live-tips';
fs.mkdirSync(output, { recursive: true });
const ids = ['preview-human', 'preview-bot-1', 'preview-bot-2', 'preview-bot-3', 'preview-bot-4'];
const roles = ['servant', 'morgana', 'merlin', 'mordred', 'percival'];
const names = ['Вы', 'Алиса', 'Борис', 'Виктор', 'Дарья'];
const profiles = Object.fromEntries(
  ids.map((id, i) => [
    id,
    {
      id,
      name: names[i],
      login: 'preview' + i,
      avatar: roles[i],
      premium: false,
      knownAchievements: [],
      games: 10,
      win: 5,
    },
  ]),
);
const missions = [2, 3, 2, 3, 3].map((players) => ({ players, failsRequired: 1 }));
const room = {
  roomID: 'review-preview',
  stage: 'started',
  leaderID: ids[0],
  createAt: new Date().toISOString(),
  startAt: new Date().toISOString(),
  players: ids.map((id, i) => ({ id, isLeader: i === 0 })),
  chat: [
    {
      userID: ids[1],
      message: 'Предлагаю взять в первый поход игроков №1 и №3. Что думаете?',
      timestamp: Date.now() - 20000,
    },
  ],
  options: { roles: ['percival', 'mordred', 'morgana'], addons: [], features: { displayIndex: true } },
  ai: {
    beginner: true,
    publicBotGame: true,
    humanPlayerID: ids[0],
    humanPlayerIDs: [ids[0]],
    status: 'running',
    language: 'ru',
    playerCount: 5,
    botDifficulty: 'regular',
    playedModel: 'gpt-6-luna',
    fallbacks: 0,
    title: 'Игра с подсказками',
    waitingForDiscussion: true,
    discussionPending: true,
    discussionPlayerID: ids[0],
    humanActionExpiresAt: Date.now() + 80000,
    humanActionBaseExpiresAt: Date.now() + 80000,
    humanTimeBankMs: 30000,
  },
  game: {
    uuid: 'review-preview',
    stage: 'selectTeam',
    vote: 0,
    mission: 0,
    settings: {
      total: 5,
      players: { good: 3, evil: 2 },
      roles: { good: ['merlin', 'percival', 'servant'], evil: ['mordred', 'morgana'] },
      missions,
    },
    players: ids.map((id, i) => ({
      id,
      index: i + 1,
      role: i === 0 ? 'morgana' : 'unknown',
      features: { isLeader: i === 0, waitForAction: i === 0 },
    })),
    missionState: missions.map((settings) => ({ ...settings })),
    history: [],
    addonsData: {},
    features: { displayIndex: true },
    timer: { active: false },
  },
};
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true, credentials: true } });
let origin;
app.get('/js/app.*.js', (req, res) => {
  const file = path.join(dist, req.path);
  const text = fs.readFileSync(file, 'utf8');
  const replacement = 'o=' + JSON.stringify(origin) + ',n=r(22547)';
  const patched = text.replace('o="avalon-game.com",n=r(22547)', replacement);
  if (patched === text) throw Error('Socket URL fixture patch failed');
  res.type('js').send(patched);
});
app.use(express.static(dist));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
const selections = [];
io.on('connection', (socket) => {
  socket.onAny((event, ...args) => {
    if (event === 'selectPlayer') {
      selections.push(args);
      const player = room.game.players.find((player) => player.id === args[1]);
      if (player) player.features.isSelected = !player.features.isSelected;
      socket.emit('roomUpdated', room);
      return;
    }
    const ack = args.at(-1);
    if (typeof ack !== 'function') return;

    if (event === 'joinRoom') return ack(room);
    if (event === 'finishAiDiscussion') return ack({ ok: true });
    if (event === 'getOnlineCounter') return ack(1);
    if (event === 'getUserProfile') return ack(profiles[args[0]] || profiles[ids[0]]);
    if (event === 'getMyProfile') return ack(profiles[ids[0]]);
    if (event === 'getAiRoomAccess')
      return ack({ canManage: false, canPlay: true, botModes: { beginner: true, regular: true, smart: false } });
    if (event === 'getVoiceAccess') return ack({ enabled: false });
    if (event === 'getUserAchievements') return ack([]);
    if (event === 'getMyStickers') return ack({ stickers: [], equipped: [] });
    ack({ error: 'forbidden' });
  });
});
(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const settleOverlays = () =>
      page.evaluate(async () => {
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const animations = [...document.querySelectorAll('.v-overlay')].flatMap((node) =>
          node.getAnimations({ subtree: true }),
        );
        await Promise.all(animations.map((animation) => animation.finished.catch(() => {})));
      });
    const errors = [];
    page.on('pageerror', (e) => {
      errors.push(e.message);
      console.error('PAGE', e.stack);
    });
    page.on('console', (m) => {
      if (m.type() === 'error') console.error('CONSOLE', m.text());
    });
    await page.setRequestInterception(true);
    page.on('request', (r) => (r.url().startsWith(origin) || r.url().startsWith('data:') ? r.continue() : r.abort()));
    await page.evaluateOnNewDocument((profile) => {
      Object.defineProperty(navigator, 'languages', { get: () => ['ru'] });
      localStorage.setItem('__user-profile__', JSON.stringify({ ...profile, token: 'local-preview-token' }));
      localStorage.setItem(
        '__user-settings__',
        JSON.stringify({ locale: { value: 'ru', isDefault: false }, colorTheme: 'light' }),
      );
    }, profiles[ids[0]]);
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(origin + '/room/review-preview/', { waitUntil: 'networkidle0' });

    await page.waitForSelector('.beginner-live-tip', { visible: true });
    assert.equal(await page.$('.ai-human-turn p'), null, 'beginner turn toolbar does not repeat the full tip');
    const rect = () =>
      page.$eval('.board-container', (n) => {
        const r = n.getBoundingClientRect();
        return [r.x, r.y, r.width, r.height];
      });
    let before = await rect();
    await page.screenshot({ path: path.join(output, 'desktop.png') });
    await page.click('.chat-bubble');
    await page.waitForSelector('.room-chat-open');
    assert.equal(
      await page.evaluate(() => !!document.querySelector('.beginner-live-tip')?.getBoundingClientRect().height),
      true,
      'desktop keeps the tip with chat open',
    );
    assert.deepEqual(await rect(), before, 'desktop chat preserves the table');
    assert.ok(
      await page.evaluate(() => {
        const a = document.querySelector('.beginner-live-tip').getBoundingClientRect();
        const b = document.querySelector('.room-chat-open').getBoundingClientRect();
        return a.right <= b.left;
      }),
      'desktop tip stays beside chat',
    );
    await page.screenshot({ path: path.join(output, 'desktop-chat.png') });
    await page.click('.chat-header button');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await new Promise((resolve) => setTimeout(resolve, 500));
    before = await rect();
    await page.waitForSelector('.tip-launcher');
    assert.equal(await page.$('.beginner-live-tip'), null, 'mobile starts with an unobtrusive launcher');
    await page.screenshot({ path: path.join(output, 'mobile-compact.png') });
    await page.click('.tip-launcher');
    await page.waitForSelector('.beginner-live-tip.is-mobile-sheet', { visible: true });
    await settleOverlays();
    assert.deepEqual(await rect(), before, 'opening tips preserves table');
    await page.screenshot({ path: path.join(output, 'mobile-expanded.png') });
    await page.locator('.tip-return').click();
    await page.waitForSelector('.is-mobile-sheet', { hidden: true });
    await page.click('.chat-bubble');
    await page.waitForSelector('.room-chat-open .beginner-live-tip');
    assert.equal(await page.$$eval('.beginner-live-tip', (nodes) => nodes.length), 1, 'one mobile tip, inside chat');
    assert.deepEqual(await rect(), before, 'mobile chat preserves table');
    await page.screenshot({ path: path.join(output, 'mobile-chat.png') });
    await page.$eval('.room-chat', (n) => n.style.setProperty('--chat-viewport-height', '360px'));
    const composerFits = await page.$eval('.room-chat-open', (panel) => {
      const r = panel.getBoundingClientRect();
      const c = panel.querySelector('.chat-composer').getBoundingClientRect();
      return c.bottom <= r.bottom + 1 && c.top >= r.top;
    });
    assert.ok(composerFits, 'embedded hint leaves the composer inside the short chat viewport');
    await page.$eval('.room-chat', (n) => n.style.removeProperty('--chat-viewport-height'));

    await page.click('.chat-header button');
    await page.waitForSelector('.tip-launcher');
    await page.click('.tip-launcher');
    await page.waitForSelector('.is-mobile-sheet', { visible: true });
    await settleOverlays();
    await page.$eval('.tip-disable', (button) => button.click());
    await page.waitForSelector('.tip-confirm', { visible: true });
    await settleOverlays();
    await page.$eval('.tip-confirm-actions button.v-btn--variant-flat', (button) => button.click());
    await page.waitForFunction(() => !document.querySelector('.tip-launcher'));
    assert.deepEqual(await rect(), before, 'disabling tips preserves table');
    for (const [width, height] of [
      [320, 568],
      [844, 390],
    ]) {
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await page.evaluate(() => {
        for (const key of Object.keys(localStorage))
          if (key.startsWith('avalon:beginner-tips:')) localStorage.removeItem(key);
      });
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForSelector('.tip-launcher', { visible: true });
      const boardBefore = await rect();
      await page.click('.tip-launcher');
      await page.waitForSelector('.is-mobile-sheet', { visible: true });
      await settleOverlays();
      assert.deepEqual(await rect(), boardBefore, 'small/landscape expansion preserves board');
      const fits = await page.$eval('.beginner-live-tip', (n) => {
        const r = n.getBoundingClientRect();
        return r.top >= 50 && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
      });
      assert.ok(fits, 'small/landscape tip stays within viewport');
    }
    for (const [width, height] of [
      [1116, 696],
      [1024, 768],
      [960, 720],
      [1280, 800],
    ]) {
      await page.setViewport({ width, height });
      await page.evaluate(() => {
        for (const key of Object.keys(localStorage))
          if (key.startsWith('avalon:beginner-tips:')) localStorage.removeItem(key);
      });
      await page.reload({ waitUntil: 'networkidle0' });
      assert.equal(await page.$('.tip-launcher'), null, `${width}x${height}: desktop keeps its left sidebar`);
      await page.waitForSelector('.beginner-live-tip', { visible: true });
      const clear = await page.$eval('.beginner-live-tip', (hint) => {
        const a = hint.getBoundingClientRect();
        return [...document.querySelectorAll('[data-player-id] .player-frame')].every((seat) => {
          const b = seat.getBoundingClientRect();
          return a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom;
        });
      });
      assert.ok(clear, `${width}x${height}: sidebar must not overlap any portrait`);
      if (width === 1116) await page.screenshot({ path: path.join(output, 'desktop-window.png') });
      if (width === 1116) {
        const withTip = await rect();
        await page.$eval('.tip-disable', (button) => button.click());
        await page.waitForSelector('.tip-confirm', { visible: true });
        await settleOverlays();
        await page.$eval('.tip-confirm-actions button.v-btn--variant-flat', (button) => button.click());
        await page.waitForFunction(() => !document.querySelector('.beginner-live-tip'));
        assert.deepEqual(await rect(), withTip, 'desktop sidebar does not participate in table flex layout');
        await page.evaluate(() => {
          for (const key of Object.keys(localStorage))
            if (key.startsWith('avalon:beginner-tips:')) localStorage.removeItem(key);
        });
        await page.reload({ waitUntil: 'networkidle0' });
      }

      await page.click('.chat-bubble');
      assert.equal(await page.$('.tip-launcher'), null, 'desktop chat never switches guidance into a mobile launcher');
      assert.equal(
        await page.$$eval('.room-chat-open .beginner-live-tip', (nodes) => nodes.length),
        0,
        'desktop tip stays outside chat',
      );
      assert.ok(await page.$('.beginner-live-tip'));
      if (width === 1116) await page.screenshot({ path: path.join(output, 'desktop-window-chat.png') });
    }
    room.ai.waitingForDiscussion = false;
    room.ai.discussionPending = false;
    for (const [width, height] of [
      [390, 844],
      [390, 664],
      [375, 667],
      [320, 568],
      [844, 390],
      [1116, 696],
      [1024, 768],
      [960, 720],
    ]) {
      room.game.players.forEach((player) => {
        player.features.isSelected = false;
      });
      await page.setViewport({ width, height });
      await page.evaluate(() => {
        for (const key of Object.keys(localStorage))
          if (key.startsWith('avalon:beginner-tips:')) localStorage.removeItem(key);
      });
      await page.reload({ waitUntil: 'networkidle0' });
      for (const id of ids) {
        const point = await page.$eval(`[data-player-id="${id}"] .player-frame`, (node) => {
          const r = node.getBoundingClientRect();
          const x = r.left + r.width / 2;
          const y = r.top + r.height / 2;
          return {
            x,
            y,
            target: document.elementFromPoint(x, y)?.closest('[data-player-id]')?.getAttribute('data-player-id'),
          };
        });
        assert.equal(point.target, id, `${width}x${height}: every seat, including yourself, is unobstructed`);
        const previous = selections.length;
        await page.mouse.click(point.x, point.y);
        for (let attempt = 0; attempt < 20 && selections.length === previous; attempt++)
          await new Promise((resolve) => setTimeout(resolve, 10));
        assert.deepEqual(selections.at(-1), ['review-preview', id], 'a real click reaches selectPlayer');
        assert.equal(selections.length, previous + 1);
        if (width === 390 && height === 664 && id === ids[0]) {
          await page.waitForSelector(`[data-player-id="${id}"].player-feature-isSelected`);
          await page.screenshot({ path: path.join(output, 'mobile-self-selected.png') });
        }
      }
    }
    room.game.stage = 'end';
    room.game.result = { winner: 'evil', reason: 'evilTeamMissions' };
    room.ai.status = 'finished';
    for (const width of [1116, 1440]) {
      await page.setViewport({ width, height: 696 });
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForSelector('.beginner-review', { visible: true });
      await page.click('.chat-bubble');
      const review = await page.$eval('.beginner-review', (n) => {
        const r = n.getBoundingClientRect();
        return { left: r.left, right: r.right, height: r.height };
      });
      if (width < 1280)
        assert.equal(review.height, 0, 'centered postgame review stays hidden behind narrow-window chat');
      else {
        assert.ok(review.height > 0, 'wide desktop postgame review remains visible with chat');
        const chatLeft = await page.$eval('.room-chat-open', (n) => n.getBoundingClientRect().left);
        assert.ok(review.right <= chatLeft, 'postgame actions remain clear of chat');
      }
    }
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        errors,
        output,
        checks:
          'desktop chat, mobile hint dialog, embedded chat, board invariance, disable, native selection of every seat at eight viewport sizes, and independent postgame chat layout',
      }),
    );
  } finally {
    await browser.close();
    io.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  io.close();
  server.close();
  process.exitCode = 1;
});
