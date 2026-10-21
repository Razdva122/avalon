// Exercise the real private dialog, Spoiler and PlayerIcon with local viewer fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { parse, compileScript, compileTemplate, compileStyle } = require('@vue/compiler-sfc');
const puppeteer = require('puppeteer');
const ui = path.resolve(__dirname, '..');
const transpile = (source) =>
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const style = [];
function component(relative, id) {
  const filename = path.join(ui, 'src', relative);
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  const script = compileScript(descriptor, { id, inlineTemplate: Boolean(descriptor.scriptSetup) });
  let code = transpile(script.content);
  if (!descriptor.scriptSetup) {
    const template = compileTemplate({
      source: descriptor.template.content,
      filename,
      id,
      compilerOptions: { bindingMetadata: script.bindings },
    });
    assert.deepEqual(template.errors, []);
    code += '\n' + transpile(template.code) + '\nexports.default.render = exports.render;';
  }
  if (id !== 'icon')
    for (const block of descriptor.styles) style.push(compileStyle({ source: block.content, id, scoped: false }).code);
  return code;
}
const sources = {
  panel: component('components/view/panels/InGamePanel.vue', 'panel'),
  playerState: transpile(fs.readFileSync(path.join(ui, 'src/helpers/composables/useGamePlayerState.ts'), 'utf8')),
  reveal: component('components/view/board/game/modules/TrapperReveal.vue', 'trapper'),
  spoiler: component('components/feedback/Spoiler.vue', 'spoiler'),
  icon: component('components/view/information/PlayerIcon.vue', 'icon'),
  helper: transpile(fs.readFileSync(path.join(ui, 'src/helpers/trapper-result.ts'), 'utf8')),
  locale: transpile(fs.readFileSync(path.join(ui, 'src/i18n/langs/trapper.ts'), 'utf8')),
};
const art = (name) =>
  `data:image/webp;base64,${fs.readFileSync(path.join(ui, 'src/assets/images/core', name + '.webp')).toString('base64')}`;
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewport({ width: 390, height: 844 });
    await page.setContent('<html lang="ru"><div id="app"></div></html>');
    await page.addScriptTag({ path: require.resolve('vue/dist/vue.global.prod.js') });
    await page.addScriptTag({ path: path.join(ui, '../../node_modules/vuetify/dist/vuetify.min.js') });
    await page.addStyleTag({ path: path.join(ui, '../../node_modules/vuetify/dist/vuetify.min.css') });
    await page.addStyleTag({
      content: `body{font-family:Arial,sans-serif;background:#f3f4f7}.player-icon-image{display:block;border-radius:50%;background-position:center;background-repeat:no-repeat}.icon-evil{background-image:url('${art('red_team_no_background')}')}.icon-good{background-image:url('${art('blue_team_no_background')}')}${style.join('\n')}`,
    });
    await page.evaluate((sources) => {
      const store = Vue.reactive({
        state: {
          profile: { id: 'leader' },
          users: { target: { status: 'ready', profile: { name: 'Игрок 4' } } },
          hideSpoilers: false,
          settings: {},
        },
      });
      const deps = {
        vue: Vue,
        '@/store': { useStore: () => store },
        '@/helpers/event-bus': { default: { emit() {} } },
        '@/helpers/styles': { calculateRoleIconStyle: () => ({}) },
      };
      const load = (source) => {
        const exports = {};
        new Function('require', 'exports', source)((id) => deps[id], exports);
        return exports;
      };
      deps['@/helpers/trapper-result'] = load(sources.helper);
      deps['@/components/feedback/Spoiler.vue'] = load(sources.spoiler);
      deps['@/components/view/information/PlayerIcon.vue'] = load(sources.icon);
      const Reveal = load(sources.reveal).default;
      window.calls = [];
      deps['@/api/socket'] = { socket: { emit: (...args) => window.calls.push(args) } };
      deps['@/helpers/composables/useGamePlayerState'] = load(sources.playerState);
      deps['@/components/view/panels/controls/AssassinateControl.vue'] = { default: { render: () => null } };
      const Panel = load(sources.panel).default;
      const mode = Vue.ref('reveal');
      const words = load(sources.locale).trapper.ru;
      const game = Vue.ref({
        uuid: 'room',
        stage: 'selectTeam',
        history: [
          { type: 'discardMissionCard', leaderID: 'leader', targetID: 'target', result: 'fail' },
          { type: 'mission' },
        ],
      });
      window.fixture = { store, game, mode };
      const app = Vue.createApp({
        setup: () => () => Vue.h(mode.value === 'panel' ? Panel : Reveal, { game: game.value }),
      });
      app.use(Vuetify.createVuetify());
      app.config.globalProperties.$store = store;
      app.config.globalProperties.$t = (key, params = {}) => {
        let text = key.startsWith('trapper.')
          ? words[key.split('.')[1]]
          : { 'inGame.fail': 'Провал', 'inGame.success': 'Успех', 'spoiler.spoiler': 'Скрыто' }[key] || key;
        for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, value);
        return text;
      };
      app.mount('#app');
    }, sources);
    await page.waitForSelector('.trapper-reveal', { visible: true });
    assert.match(await page.$eval('.trapper-reveal', (el) => el.innerText), /Игрок 4[\s\S]*Провал/);
    const bounds = await page.$eval('.trapper-reveal', (el) => ({
      left: el.getBoundingClientRect().left,
      right: el.getBoundingClientRect().right,
    }));
    assert.ok(bounds.left >= 0 && bounds.right <= 390);
    await page.waitForFunction(
      () =>
        !document
          .getAnimations()
          .some(
            (animation) =>
              animation.playState === 'running' && Number.isFinite(animation.effect.getComputedTiming().endTime),
          ),
    );
    await page.screenshot({ path: '/tmp/avalon-trapper-mobile.png' });
    await page.click('.trapper-reveal button');
    await page.waitForSelector('.trapper-reveal', { hidden: true });
    await page.evaluate(() => {
      window.fixture.game.value = { ...window.fixture.game.value };
    });
    assert.equal(await page.$('.v-overlay--active .trapper-reveal'), null, 'ordinary updates must not reopen the card');
    await page.evaluate(() => {
      window.fixture.store.state.profile.id = 'spectator';
      window.fixture.game.value = { ...window.fixture.game.value, uuid: 'other-room' };
    });
    assert.equal(await page.$('.v-overlay--active .trapper-reveal'), null, 'spectators never open the private card');
    await page.evaluate(() => {
      window.fixture.store.state.profile.id = 'leader';
      window.fixture.store.state.hideSpoilers = true;
      window.fixture.game.value = { ...window.fixture.game.value, uuid: 'restored-room' };
    });
    await page.waitForSelector('.trapper-reveal .spoiler', { visible: true });
    assert.equal(await page.$('.trapper-reveal .icon-evil'), null, 'spoiler mode must conceal the card art');
    assert.ok(!(await page.$eval('.trapper-reveal', (el) => el.innerText)).includes('Провал'));
    await page.evaluate(() => {
      window.fixture.game.value = { ...window.fixture.game.value, stage: 'end' };
    });
    await page.waitForSelector('.trapper-reveal', { hidden: true });
    await page.evaluate(() => {
      const fixture = window.fixture;
      fixture.store.state.profile.id = 'leader';
      fixture.mode.value = 'panel';
      fixture.game.value = {
        uuid: 'action-room',
        stage: 'discardMissionCard',
        players: [
          { id: 'leader', features: { isLeader: true, waitForAction: true } },
          { id: 'target', features: { isSent: true } },
          { id: 'outsider', features: {} },
        ],
      };
    });
    await page.waitForSelector('#app button');
    assert.equal(await page.$eval('#app button', (button) => button.disabled), true);
    await page.evaluate(() => {
      window.fixture.game.value.players[2].features.isSelected = true;
    });
    assert.equal(await page.$eval('#app button', (button) => button.disabled), true);
    await page.evaluate(() => {
      window.fixture.game.value.players[2].features.isSelected = false;
      window.fixture.game.value.players[1].features.isSelected = true;
    });
    assert.equal(await page.$eval('#app button', (button) => button.disabled), false);
    await page.click('#app button');
    assert.deepEqual(await page.evaluate(() => window.calls), [['discardMissionCard', 'action-room']]);
    await page.evaluate(() => {
      window.fixture.store.state.profile.id = 'outsider';
    });
    assert.equal(await page.$('#app button'), null);
    assert.deepEqual(errors, []);
    console.log(
      'Trapper private reveal passed: mobile bounds, result, dismissal, viewer isolation, restored snapshot and Spoiler.',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
