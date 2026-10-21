const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');
const { parse, compileScript } = require('@vue/compiler-sfc');
const { renderToString } = require('@vue/server-renderer');
const { createI18n } = require('vue-i18n');

test('usage table counts input plus output once, marks incomplete totals and renders safe settings', async () => {
  const source = fs.readFileSync(require.resolve('../src/pages/admin/BotUsageStats.vue'), 'utf8');
  const { descriptor } = parse(source);
  const script = compileScript(descriptor, { id: 'usage', inlineTemplate: true }).content;
  const code = ts.transpileModule(script, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(require, module, module.exports);
  const base = {
    instanceID: 'one',
    startedAt: 123,
    humanCount: 2,
    botCount: 3,
    status: 'paused',
    mode: 'regular',
    language: 'ru',
    options: { roles: { merlin: 1 } },
    settings: [{ model: '<private>', reasoning: 'low' }],
    inputTokens: 100,
    cachedTokens: 40,
    outputTokens: 20,
    reasoningTokens: 10,
    requests: 2,
    unknownUsageRequests: 0,
    weeklySpent: 2,
    shortTermSpent: null,
  };
  const app = vue.createSSRApp(module.exports.default, {
    games: [
      { ...base, roomID: 'first' },
      { ...base, roomID: 'second', unknownUsageRequests: 1, weeklySpent: null },
    ],
  });
  app.component('RouterLink', { props: ['to'], template: '<a><slot /></a>' });
  app.use(createI18n({ legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false, messages: { en: {} } }));
  const html = await renderToString(app);
  assert.ok(html.includes('≥ 240'), html);
  assert.ok(!html.includes('≥ 340'));
  assert.ok(html.includes('≥ 2 / —'));
  assert.ok(html.includes('2 / 3'));
  assert.ok(html.includes('&lt;private&gt;'));
  assert.ok(!html.includes('<private>'));
  assert.ok(html.includes('first') && html.includes('second'));
});
