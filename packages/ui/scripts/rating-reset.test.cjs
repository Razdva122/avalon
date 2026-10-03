const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const languageExports = {};
new Function(
  'require',
  'exports',
  ts.transpileModule(fs.readFileSync(require.resolve('../src/helpers/i18n/index.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
)(() => ({}), languageExports);

function profile() {
  const pending = [];
  const socket = { emit: (event, id, callback) => pending.push({ event, id, callback }) };
  const source = fs
    .readFileSync(require.resolve('../src/pages/profile/Profile.vue'), 'utf8')
    .match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    (id) => {
      if (id === 'vue') return require('vue');
      if (id === '@/api/socket') return { socket };
      if (id === '@/helpers/i18n') return languageExports;
      if (id === '@/helpers/event-bus') return { default: { emit() {} } };
      return {};
    },
    module,
    module.exports,
  );
  const page = module.exports.default;
  const state = {
    $store: { state: { profile: { id: 'me' } } },
    $t: (key) => key,
    trueSkillRating: null,
    ratingLoading: false,
    ratingResetLoading: false,
    nextResetDate: null,
    canResetRating: true,
    resetCooldownMonths: 3,
  };
  return { page, state, pending };
}

test('profile offers every supported language even when only English and Russian messages are loaded', () => {
  const { page, state } = profile();
  state.$i18n = { availableLocales: ['en', 'ru'] };
  const data = page.data.call(state);
  assert.deepEqual(data.availableLocales, [
    { value: 'en', title: 'English' },
    { value: 'ru', title: 'Русский' },
    { value: 'zh-TW', title: '繁體中文' },
    { value: 'zh-CN', title: '简体中文' },
    { value: 'es', title: 'Español' },
    { value: 'pt', title: 'Português' },
  ]);
});

test('profile uses the server reset date and interval, including clearing a previous date', () => {
  const { page, state, pending } = profile();
  page.methods.checkResetRatingAvailability.call(state);
  assert.equal(state.ratingLoading, true);
  pending.shift().callback({
    success: true,
    rating: { lastResetAt: '2026-08-17T12:00:00Z' },
    resetCooldownMonths: 1,
    nextResetAvailableAt: '2026-09-17T12:00:00Z',
  });
  assert.equal(state.nextResetDate.toISOString(), '2026-09-17T12:00:00.000Z');
  assert.equal(state.resetCooldownMonths, 1);
  page.methods.checkResetRatingAvailability.call(state);
  pending.shift().callback({ success: true, rating: {}, resetCooldownMonths: 3 });
  assert.equal(state.nextResetDate, null);
  assert.equal(state.resetCooldownMonths, 3);
});

test('a rejected reset uses the returned availability date without adding another cooldown', () => {
  const { page, state, pending } = profile();
  page.methods.resetRating.call(state);
  pending.shift().callback({ success: false, nextResetAvailableAt: '2026-10-17T12:00:00Z' });
  assert.equal(state.nextResetDate.toISOString(), '2026-10-17T12:00:00.000Z');
  assert.equal(state.ratingResetLoading, false);
});
