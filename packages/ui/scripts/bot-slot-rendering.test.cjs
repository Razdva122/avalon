const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vue = require('vue');
const { parse, compileScript } = require('@vue/compiler-sfc');
const { renderToString } = require('@vue/server-renderer');
const { createI18n } = require('vue-i18n');

function evaluate(source, requireModule = require) {
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(requireModule, module, module.exports);
  return module.exports;
}
const source = (file) => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
const dashboardModule = evaluate(source('helpers/composables/useBotDashboard.ts'), (id) => (id === 'vue' ? vue : {}));
const locales = evaluate(source('pages/admin/locales.ts'));
const empty = vue.defineComponent({ setup: () => () => null });

async function render(instances) {
  const data = vue.ref({ checkedAt: 1, instances, thresholds: {}, games: [], accountUsage: [] });
  const { descriptor } = parse(source('pages/admin/Bots.vue'));
  const script = compileScript(descriptor, { id: 'bot-slots', inlineTemplate: true }).content;
  const component = evaluate(script, (id) => {
    if (id === 'vue') return vue;
    if (id === './locales') return locales;
    if (id.startsWith('./Bot')) return { default: empty };
    if (id.includes('useBotDashboard'))
      return {
        getBotSlots: dashboardModule.getBotSlots,
        useBotDashboard: () => ({
          data,
          denied: vue.ref(false),
          error: vue.ref(false),
          loading: vue.ref(false),
          saving: vue.ref(false),
          resetting: vue.ref(null),
          resetAttempts: vue.ref({}),
          resetFeedback: vue.ref({}),
        }),
      };
    return require(id);
  }).default;
  const app = vue.createSSRApp(component);
  const pass = vue.defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        vue.h('div', slots.default?.()),
  });
  for (const name of ['v-dialog', 'v-btn', 'v-icon', 'RouterLink']) app.component(name, pass);
  app.use(
    createI18n({
      legacy: false,
      locale: 'ru',
      fallbackLocale: 'ru',
      messages: {
        ru: {
          aiArena: evaluate(source('i18n/langs/ru/aiArena.ts')).default,
          menu: { settings: 'Настройки' },
          infoMessage: { close: 'Закрыть' },
        },
      },
    }),
  );
  return renderToString(app);
}
const bot = (id, status, rooms) => ({
  id,
  status,
  maxGames: 2,
  rooms: rooms.map((roomID) => ({ roomID })),
  modes: { smart: false, regular: true, beginner: true },
  quota: {
    remainingPercent: 90,
    resetsAt: null,
    checkedAt: 1,
    shortTerm: null,
  },
});
function summary(html) {
  return [...html.matchAll(/<dt[^>]*>(.*?)<\/dt>\s*<dd[^>]*>(.*?)<\/dd>/gs)].map((match) => [
    match[1],
    Number(match[2]),
  ]);
}

test('admin renders four game slots for two accounts and shows occupied/free counts per account', async () => {
  const html = await render([bot('one', 'free', ['room-a']), bot('two', 'free', [])]);
  assert.deepEqual(summary(html), [
    ['Игровых слотов всего', 4],
    ['Занято', 1],
    ['Свободно', 3],
    ['Недоступно', 0],
  ]);
  assert.match(html, /Аккаунтов: 2/);
  assert.match(html, /Занято 1 из 2 игровых слотов/);
  assert.match(html, /Занято 0 из 2 игровых слотов/);
});

test('quota-blocked unused slots are rendered as unavailable instead of free', async () => {
  const html = await render([bot('one', 'unavailable', ['room-a']), bot('two', 'free', [])]);
  assert.deepEqual(summary(html), [
    ['Игровых слотов всего', 4],
    ['Занято', 1],
    ['Свободно', 2],
    ['Недоступно', 1],
  ]);
});
