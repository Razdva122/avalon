const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vue = require('vue');
const { createI18n } = require('vue-i18n');
const { renderToString } = require('@vue/server-renderer');
function load(file) {
  const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(require, module, module.exports);
  return module.exports;
}

test('public dictionaries omit admin-only form copy while preserving the menu entry', () => {
  for (const language of ['en', 'ru', 'vi', 'es', 'pt', 'zh_CN', 'zh_TW']) {
    const messages = load(`i18n/langs/${language}/aiArena.ts`).default;
    assert.ok(messages.botDashboard);
    assert.equal(messages.thresholdTitle, undefined, language);
  }
});

test('the lazy admin page installs copy for each language, including a freshly loaded dictionary', async () => {
  const { useAdminBotMessages } = load('pages/admin/locales.ts');
  for (const language of ['en', 'ru', 'vi', 'es', 'pt', 'zh-CN', 'zh-TW']) {
    const i18n = createI18n({
      legacy: false,
      locale: language,
      fallbackLocale: 'en',
      messages: { [language]: { aiArena: { botDashboard: 'Menu' } } },
    });
    const app = vue.createSSRApp({
      setup() {
        const { t } = useAdminBotMessages();
        return () => vue.h('p', t('aiArena.thresholdTitle'));
      },
    });
    app.use(i18n);
    const html = await renderToString(app);
    assert.ok(!html.includes('aiArena.thresholdTitle'), language);
    assert.equal(i18n.global.t('aiArena.botDashboard'), 'Menu');
    assert.ok(i18n.global.t('aiArena.thresholdRangeError').length > 5);
    for (const key of [
      'usagePeriod',
      'usagePercent',
      'usageNoData',
      'usageAtLeast',
      'usageHumanCount',
      'usageBotCount',
      'usageDetails',
      'usageInput',
      'usageOutput',
      'resetTitle',
      'resetConfirm',
      'resetResulterror',
      'resetResultnoCredit',
      'dashboardAccounts',
      'dashboardSlotsUsed',
      'dashboardSlotsFree',
      'dashboardSlotsUnavailable',
      'dashboardSlotUsage',
      'dashboardSlotAvailability',
      'dashboardSlotHelp',
    ]) {
      const path = `aiArena.${key}`;
      assert.notEqual(
        i18n.global.t(path, { value: 2, count: 2, used: 1, total: 2, free: 1, unavailable: 0 }),
        path,
        `${language}: ${key}`,
      );
    }
  }
});

test('switching to a newly loaded language restores lazy admin translations', async () => {
  const { useAdminBotMessages } = load('pages/admin/locales.ts');
  const renderer = vue.createRenderer({
    createElement: () => ({}),
    createText: () => ({}),
    createComment: () => ({}),
    insert() {},
    remove() {},
    setElementText() {},
    setText() {},
    patchProp() {},
    parentNode: () => null,
    nextSibling: () => null,
  });
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: {} } });
  const app = renderer.createApp({
    setup() {
      useAdminBotMessages();
      return () => null;
    },
  });
  app.use(i18n);
  app.mount({});
  try {
    for (const language of ['ru', 'vi', 'es', 'pt', 'zh-CN', 'zh-TW', 'en']) {
      i18n.global.setLocaleMessage(language, { aiArena: { botDashboard: 'Menu' } });
      i18n.global.locale.value = language;
      await vue.nextTick();
      assert.notEqual(i18n.global.t('aiArena.thresholdTitle'), 'aiArena.thresholdTitle');
      assert.equal(i18n.global.t('aiArena.botDashboard'), 'Menu');
    }
  } finally {
    app.unmount();
  }
});
