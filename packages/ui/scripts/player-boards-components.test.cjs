const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vue = require('vue');
const { renderToString } = require('@vue/server-renderer');
const { parse, compileScript } = require('@vue/compiler-sfc');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
function component(name, inlineTemplate = false) {
  const file = path.resolve(__dirname, `../src/pages/community/${name}.vue`);
  const { descriptor } = parse(fs.readFileSync(file, 'utf8'), { filename: file });
  const script = compileScript(descriptor, { id: file, inlineTemplate });
  const code = ts.transpileModule(script.content, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const load = (id) => {
    if (id === 'vue') return vue;
    if (id === 'vue-i18n') return { useI18n: () => ({ t: (key) => key, locale: vue.ref('ru') }) };
    if (id.startsWith('@avalon/types/')) return require(`../../types/${id.split('/').at(-1)}.ts`);
    if (id === './board-helpers' || id === './board-display')
      return require(`../src/pages/community/${id.slice(2)}.ts`);
    return { default: { render: () => null } };
  };
  new Function('require', 'module', 'exports', code)(load, module, module.exports);
  return module.exports.default;
}
const now = Date.parse('2026-09-29T12:00:00Z');
const listing = (kind) => ({
  id: 'test',
  kind,
  name: 'Test',
  groupName: kind === 'group' ? 'Test group' : '',
  active: false,
  moderated: false,
  languages: ['ru'],
  days: [],
  startHour: 0,
  endHour: 0,
  timeZone: '',
  communication: 'either',
  experience: 'experienced',
  beginnerFriendly: false,
  canTeach: true,
  groupSize: kind === 'group' ? 4 : 1,
  contacts: [
    { type: 'discord', value: '123124' },
    { type: 'wechat', value: '201212' },
  ],
  bumpedAt: new Date(now).toISOString(),
  expiresAt: new Date(now + 30 * 86400000).toISOString(),
});
for (const kind of ['solo', 'group']) {
  test(`${kind}: editing saved optional fields emits a complete draft without metadata`, () => {
    const emitted = [];
    const form = component('BoardForm').setup(
      { kind, initial: listing(kind), busy: false },
      {
        expose() {},
        emit: (...args) => emitted.push(args),
      },
    );
    form.submit();
    assert.equal(form.invalid.value, false);
    assert.equal(emitted[0][0], 'save');
    const draft = emitted[0][1];
    assert.equal(draft.otherLanguage, '');
    assert.equal(draft.scheduleEnabled, false);
    assert.equal('id' in draft, false);
    assert.equal('active' in draft, false);
    assert.deepEqual(draft.contacts, listing(kind).contacts);
  });
  test(`${kind}: hidden listing shows an enabled activation button during bump cooldown`, async () => {
    const html = await renderToString(
      vue.createSSRApp(component('BoardCard', true), { listing: listing(kind), owner: true, now }),
    );
    assert.match(html, /<button[^>]*class="activate-button"[^>]*>playerBoards.reactivate<\/button>/);
    const activation = html.match(/<button[^>]*class="activate-button"[^>]*>/)[0];
    assert.doesNotMatch(activation, /disabled/);
    assert.doesNotMatch(html, /playerBoards.bumpAvailable/);
  });
}
