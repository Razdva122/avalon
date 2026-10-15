const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');
const { parse, compileScript } = require('@vue/compiler-sfc');
const { renderToString } = require('@vue/server-renderer');
const { createI18n } = require('vue-i18n');

const { descriptor } = parse(
  fs.readFileSync(require.resolve('../src/components/stats/UserProfileDetails.vue'), 'utf8'),
);
const source = compileScript(descriptor, { id: 'profile-details', inlineTemplate: true }).content;
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

async function render(profile, locale = 'ru') {
  const exports = {};
  new Function('require', 'exports', code)((id) => {
    if (id === '@/helpers/composables/useUserProfile') {
      return { useUserProfile: () => ({ userState: vue.ref({ status: 'ready', profile }) }) };
    }
    return require(id);
  }, exports);
  const app = vue.createSSRApp(exports.default, { uuid: 'player' });
  app.use(
    createI18n({
      legacy: false,
      locale,
      messages: {
        [locale]: {
          userStats: {
            aiGames: 'Игры с AI',
            registrationDate: 'Дата регистрации',
          },
        },
      },
    }),
  );
  return renderToString(app);
}

test('profile renders zero AI games and a localized registration date with a machine-readable value', async () => {
  const registrationDate = '2025-03-12T10:30:00.000Z';
  const html = await render({ aiGamesCount: 0, registrationDate });
  assert.match(html, /Игры с AI/);
  assert.match(html, /<dd>0<\/dd>/);
  assert.match(html, /Дата регистрации/);
  assert.ok(html.includes(`datetime="${registrationDate}"`));
  assert.ok(html.includes(new Date(registrationDate).toLocaleDateString('ru')));
  const english = await render({ aiGamesCount: 12, registrationDate }, 'en');
  assert.ok(english.includes(new Date(registrationDate).toLocaleDateString('en')));
});

test('missing and invalid registration dates never display a fabricated date', async () => {
  for (const registrationDate of [undefined, 'invalid']) {
    const html = await render({ aiGamesCount: 3, registrationDate });
    assert.match(html, /<dd>3<\/dd>/);
    assert.doesNotMatch(html, /<time|Invalid Date/);
  }
});
