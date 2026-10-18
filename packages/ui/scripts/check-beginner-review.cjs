// Isolated browser check of the real card, with controlled socket responses.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { parse, compileScript, compileStyle } = require('@vue/compiler-sfc');
const puppeteer = require('puppeteer');
const ui = path.resolve(__dirname, '..');
const transpile = (source) =>
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const file = path.join(ui, 'src/components/view/information/BeginnerReview.vue');
const { descriptor } = parse(fs.readFileSync(file, 'utf8'), { filename: file });
const component = transpile(compileScript(descriptor, { id: 'review', inlineTemplate: true }).content);
const styles = compileStyle({ source: descriptor.styles[0].content, id: 'review', scoped: false });
assert.deepEqual(styles.errors, []);
const helper = transpile(fs.readFileSync(path.join(ui, 'src/helpers/beginner-review.ts'), 'utf8'));
const localeModule = { exports: {} };
new Function('exports', transpile(fs.readFileSync(path.join(ui, 'src/i18n/langs/beginnerReview.ts'), 'utf8')))(
  localeModule.exports,
);
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewport({ width: 390, height: 844 });
    await page.setContent(`<html lang="ru"><style>
      :root { --v-theme-surface:255,255,255; --v-theme-surface-border:210,218,225; --v-theme-text-primary:25,35,45; --v-theme-text-secondary:75,85,95; --v-theme-primary:41,95,143; --v-theme-on-primary:255,255,255; --v-theme-error:180,40,40 }
      * {box-sizing:border-box} h2,h3 {margin:0} body {font-family:Arial,sans-serif;background:#edf1f4;margin:0} button {border:0;background:none} .material-icons {font-size:0!important} .material-icons::after {content:'⌄';font-size:20px} ${styles.code}
      </style><div id="app"></div></html>`);
    await page.addScriptTag({ path: require.resolve('vue/dist/vue.global.js') });
    await page.evaluate(
      ({ component, helper, translations }) => {
        const module = { exports: {} };
        new Function('exports', helper)(module.exports);
        window.calls = [];
        window.routes = [];
        window.forceUnavailable = false;
        const t = (key, params = {}) => {
          const roles = {
            merlin: 'Мерлин',
            servant: 'Слуга Артура',
            percival: 'Персиваль',
            morgana: 'Моргана',
            mordred: 'Мордред',
          };
          let text = key.startsWith('beginnerReview.')
            ? key
                .split('.')
                .slice(1)
                .reduce((value, part) => value?.[part], translations)
            : key.startsWith('roles.')
              ? roles[key.split('.')[1]]
              : {
                  'beginnerTips.yourRole': 'Ваша роль: {role}',
                  'aiArena.selectRole': 'Ваша роль',
                  'endReason.killMerlin': 'Убийца нашёл Мерлина',
                }[key] || key;
          for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, value);
          return text;
        };
        const dependencies = {
          vue: Vue,
          'vue-i18n': { useI18n: () => ({ t, locale: Vue.ref('ru') }) },
          'vue-router': { useRouter: () => ({ currentRoute: Vue.ref({ params: { uuid: 'old-room' } }) }) },
          '@/helpers/beginner-review': module.exports,
          '@/helpers/images': {
            getAvatarPathByID: () =>
              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"/>',
          },
          '@avalon/types/room/ai-roles': {
            aiHumanRoles: () => ['merlin', 'percival', 'servant', 'mordred', 'morgana'],
          },
          '@/helpers/open-room-route': {
            openRoomRoute: async (_router, id) => {
              window.routes.push(id);
              return true;
            },
          },
          '@/api/socket': {
            socket: {
              timeout: () => ({
                emitWithAck: async (...args) => {
                  window.calls.push(args);
                  await new Promise((resolve) => setTimeout(resolve, 100));
                  if (args[0] === 'getBeginnerReview')
                    return {
                      status: 'complete',
                      review: {
                        decision: 'Вы поддержали состав второго похода.',
                        observation: 'В нём осталась вся пара из первого проваленного похода.',
                        next: 'Предложите заменить одного участника и объясните, какую версию проверяете.',
                        episodeID: 'vote-2',
                        mission: 2,
                        action: 'vote',
                      },
                    };
                  if (args[0] === 'getAiRoomAccess')
                    return {
                      canPlay: true,
                      botModes: { beginner: !window.forceUnavailable },
                      botsBusy: window.forceUnavailable,
                    };
                  return args[0] === 'createHumanAiRoom' ? { roomID: 'new-room' } : { ok: true };
                },
              }),
            },
          },
        };
        const output = { exports: {} };
        new Function('require', 'module', 'exports', component)((id) => dependencies[id], output, output.exports);
        Vue.createApp(output.exports.default, {
          roomID: 'old-room',
          userID: 'me',
          ai: { beginner: true, humanPlayerID: 'me', language: 'ru', status: 'finished' },
          game: {
            stage: 'end',
            result: { winner: 'evil', reason: 'killMerlin' },
            players: [{ id: 'me', role: 'merlin' }],
            history: [],
          },
        }).mount('#app');
      },
      { component, helper, translations: localeModule.exports.beginnerReview.ru },
    );
    await page.waitForSelector('.review-play');
    await page.waitForSelector('details.review-observation');
    for (const [width, height] of [
      [390, 844],
      [320, 568],
      [1440, 900],
    ]) {
      await page.setViewport({ width, height });
      const bounds = await page.$eval('.beginner-review', (node) => {
        const r = node.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      });
      assert.ok(bounds.left >= 0 && bounds.right <= width && bounds.top >= 0 && bounds.bottom <= height);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    await page.setViewport({ width: 390, height: 844 });
    const outputDir = process.env.AVALON_REVIEW_SCREENSHOTS || '/tmp/avalon-beginner-review';
    fs.mkdirSync(outputDir, { recursive: true });
    await page.screenshot({ path: path.join(outputDir, 'mobile.png') });
    assert.equal(await page.$eval('.review-heading', (node) => node.getAttribute('aria-expanded')), 'false');
    await page.click('.review-heading');
    assert.equal(await page.$eval('.review-heading', (node) => node.getAttribute('aria-expanded')), 'true');
    assert.match(
      await page.$eval('.review-content', (node) => node.textContent),
      /Вы поддержали состав второго похода/,
    );
    assert.equal(await page.$('.review-settings'), null, 'replay omits the redundant settings line');
    assert.equal(await page.$eval('details.review-observation', (node) => node.open), false);
    await page.click('.review-observation summary');
    assert.equal(await page.$eval('details.review-observation', (node) => node.open), true);
    assert.equal(await page.$eval('.review-observation > p', (node) => node.getBoundingClientRect().height > 0), true);
    await page.focus('.review-observation summary');
    await page.keyboard.press('Enter');
    assert.equal(await page.$eval('details.review-observation', (node) => node.open), false);
    await page.click('.review-heading');
    await page.click('.review-hide');
    assert.equal(await page.$('.review-play'), null);
    await page.click('.review-restore');
    assert.equal(await page.$eval('.review-heading', (node) => node.getAttribute('aria-expanded')), 'false');
    assert.match(await page.$eval('.review-play', (node) => node.textContent), /Ещё раз за Мерлина/);
    await page.click('.review-change');
    await page.waitForFunction(() => document.activeElement.matches('.review-role input:checked'));
    assert.equal(await page.$$eval('.review-role input[type=radio]', (nodes) => nodes.length), 5);
    assert.equal(await page.$$eval('.review-role input:checked', (nodes) => nodes.length), 1);
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [1440, 900],
    ]) {
      await page.setViewport({ width, height });
      const tiles = await page.$$eval('.review-role-option', (nodes) =>
        nodes.map((node) => {
          const r = node.getBoundingClientRect();
          return { top: r.top, width: r.width, height: r.height, right: r.right };
        }),
      );
      assert.equal(new Set(tiles.map((tile) => Math.round(tile.top))).size, 1, 'all five roles stay in one row');
      assert.ok(
        tiles.every((tile) => tile.width >= 44 && tile.height >= 44 && tile.right <= width),
        'role targets stay tappable and inside the viewport',
      );
    }
    await page.setViewport({ width: 390, height: 844 });
    await page.click('.review-role input[value="morgana"]');
    assert.equal(await page.$eval('.review-role input[value="morgana"]', (node) => node.checked), true);
    await page.focus('.review-role input[value="morgana"]');
    await page.keyboard.press('ArrowLeft');
    assert.match(await page.$eval('.review-play', (node) => node.textContent), /Ещё раз за Мордреда/);
    await page.keyboard.press('ArrowRight');
    assert.match(await page.$eval('.review-play', (node) => node.textContent), /Ещё раз за Моргану/);
    await page.setViewport({ width: 844, height: 390 });
    await page.waitForFunction(
      () => document.querySelector('.beginner-review').getBoundingClientRect().right <= innerWidth,
    );
    await page.evaluate(() => {
      window.forceUnavailable = true;
    });
    await page.click('.review-play');
    await page.waitForSelector('.review-error');
    const controlsFit = await page.$eval('.beginner-review', (panel) => {
      const outer = panel.getBoundingClientRect();
      return ['.review-play', '.review-change', '.review-error'].every((selector) => {
        const rect = panel.querySelector(selector).getBoundingClientRect();
        return rect.top >= outer.top && rect.bottom <= outer.bottom + 1;
      });
    });
    assert.equal(controlsFit, true, 'short screens keep replay and errors inside the panel with role selection open');
    await page.evaluate(() => {
      window.forceUnavailable = false;
      window.calls = [];
    });

    await page.click('.review-play');
    assert.equal(await page.$eval('.review-play', (node) => node.disabled), true);
    assert.equal(
      await page.$$eval('.review-role input', (nodes) => nodes.every((node) => node.matches(':disabled'))),
      true,
    );
    await page.waitForFunction(() => window.routes.length === 1);
    const calls = await page.evaluate(() => window.calls);
    assert.equal(calls[1][1].role, 'morgana');
    assert.equal(calls[1][1].language, 'ru');
    assert.equal(calls[2][0], 'startHumanAiRoom');
    assert.deepEqual(errors, []);
    console.log('Beginner review: viewport bounds, collapse, role selection and replay passed.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
