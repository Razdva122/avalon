const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Vue = require('vue');
const { parse } = require('@vue/compiler-sfc');
const { renderToString } = require('@vue/server-renderer');
const { createI18n } = require('vue-i18n');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });

// Run each real SFC's script and compiled template with the real Vue/i18n renderer.
function loadComponent(name) {
  const filename = path.join(__dirname, '../src/components/view/information/history', `${name}.vue`);
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'));
  const script = ts.transpileModule(descriptor.script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', script)(require, module, module.exports);
  const component = module.exports.default;
  component.render = Vue.compile(descriptor.template.content);
  return component;
}

const cases = [
  ['CheckLoyalty', { validatorID: 'a', inspectedID: 'b' }],
  ['RevealLoyalty', { revealerID: 'a', targetID: 'b' }],
  ['AnnounceLoyalty', { announcerID: 'a', targetID: 'b', announced: 'good' }],
  ['SwitchResult', { switcherID: 'a', targetID: 'b' }],
  ['GiveCard', { target: 'player', leaderID: 'a', ownerID: 'b', cardName: 'ambush' }],
  ['GiveCard', { target: 'self', leaderID: 'a', cardName: 'ambush' }],
  ['RestoreHonor', { newOwnerID: 'a', prevOwnerID: 'b', cardName: 'ambush' }],
  ['Ambush', { ownerID: 'a', targetID: 'b' }],
  ['LeadToVictory', { ownerID: 'a', prevLeaderID: 'b' }],
  ['KingReturns', { ownerID: 'a' }],
  ['WeFoundYou', { ownerID: 'a', selectedPlayerID: 'b' }],
  ['PlayCard', { ownerID: 'a', cardName: 'ambush' }],
];
const attack = '<img src=x onerror="alert(1)"> & <svg onload="alert(2)">';
const escaped = '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &lt;svg onload=&quot;alert(2)&quot;&gt;';

for (const locale of ['en', 'ru', 'es', 'pt', 'zh_CN', 'zh_TW']) {
  for (const [name, data] of cases) {
    test(`${locale}: ${name} ${data.target || ''} renders player names as bold text, never HTML`, async () => {
      const messages = require(`../src/i18n/langs/${locale}/history.ts`).default;
      const i18n = createI18n({
        legacy: false,
        locale,
        fallbackLocale: 'en',
        missingWarn: false,
        fallbackWarn: false,
        warnHtmlMessage: false,
        messages: {
          en: require('../src/i18n/langs/en/history.ts').default,
          [locale]: {
            ...messages,
            cardsInfo: { ambush: 'Ambush', kingReturns: 'King', leadToVictory: 'Lead', weFoundYou: 'Found' },
            game: { good: 'Good' },
          },
        },
      });
      const app = Vue.createSSRApp(loadComponent(name), { data, playerNames: { a: attack, b: 'Alice & Bob' } });
      app.use(i18n);
      const html = await renderToString(app);
      assert.doesNotMatch(html, /<(?:img|svg)\b/i, 'player input must not create elements');
      assert.ok(html.includes(`<b>${escaped}</b>`), 'player name must be preserved literally and bold');
      if (Object.values(data).includes('b')) assert.ok(html.includes('<b>Alice &amp; Bob</b>'));
      assert.doesNotMatch(html, /&lt;\/?b&gt;/, 'formatting must remain actual bold markup');
    });
  }
}
