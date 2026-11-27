const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vue = require('vue');
const { createI18n } = require('vue-i18n');

function evaluate(source, load = require) {
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(load, module, module.exports);
  return module.exports;
}
const read = (relative) => fs.readFileSync(path.join(__dirname, relative), 'utf8');

const locales = ['en', 'ru', 'es', 'pt', 'zh_CN', 'zh_TW', 'vi'];
const messages = Object.fromEntries(
  locales.map((locale) => [locale, evaluate(read(`../src/i18n/langs/${locale}/errors.ts`)).default]),
);
const socketErrors = evaluate(read('../src/helpers/socket-errors.ts'));
const serverCodes = ['invalidRequest', 'rateLimited', 'roomLimit', 'forbidden', 'requestFailed'];

function mountSnackbar(locale = 'en') {
  const i18n = createI18n({ legacy: false, locale, fallbackLocale: 'en', messages, missingWarn: false });
  const socketHandlers = {};
  const busHandlers = {};
  const component = evaluate(
    read('../src/components/feedback/InfoSnackbar.vue').match(/<script lang="ts">([\s\S]*?)<\/script>/)[1],
    (id) => {
      if (id === 'vue') return vue;
      if (id === 'vue-i18n') return { useI18n: () => i18n.global };
      if (id === '@/api/socket') return { socket: { on: (event, handler) => (socketHandlers[event] = handler) } };
      if (id === '@/helpers/event-bus') return { default: { on: (event, handler) => (busHandlers[event] = handler) } };
      if (id === '@/helpers/socket-errors') return socketErrors;
      throw Error(`unexpected import ${id}`);
    },
  ).default;
  const state = component.setup();
  return {
    i18n,
    state,
    serverError: (error) => socketHandlers.serverError(error),
    infoMessage: (message) => busHandlers.infoMessage(message),
  };
}

test('server error codes sent by the backend have translations in every locale', () => {
  for (const locale of locales)
    for (const code of serverCodes)
      assert.equal(typeof messages[locale].errors[code], 'string', `missing errors.${code} in ${locale}`);
});

test('rate limit server errors show the existing translation instead of the code', () => {
  const snackbar = mountSnackbar();
  snackbar.serverError('rateLimited');
  assert.equal(snackbar.state.snackbar.value, true);
  assert.equal(snackbar.state.text.value, 'Too many requests. Please wait and try again.');
});

test('known server error codes are translated in the current locale', () => {
  for (const locale of locales) {
    const snackbar = mountSnackbar(locale);
    for (const code of serverCodes) {
      snackbar.serverError(code);
      assert.equal(snackbar.state.text.value, messages[locale].errors[code], `${locale} ${code}`);
    }
  }
});

test('changing the language translates later server errors in the new language', () => {
  const snackbar = mountSnackbar('en');
  snackbar.serverError('forbidden');
  assert.equal(snackbar.state.text.value, messages.en.errors.forbidden);
  snackbar.i18n.global.locale.value = 'ru';
  snackbar.serverError('forbidden');
  assert.equal(snackbar.state.text.value, messages.ru.errors.forbidden);
});

test('unknown or malformed server errors fall back to a generic message without exposing details', () => {
  for (const locale of locales) {
    const snackbar = mountSnackbar(locale);
    for (const error of ['unknownCode', 'internal.stack', '', undefined, null, 123, {}, ['rateLimited']]) {
      snackbar.serverError(error);
      assert.equal(snackbar.state.snackbar.value, true);
      assert.equal(snackbar.state.text.value, messages[locale].errors.requestFailed, `${locale} ${String(error)}`);
      assert.doesNotMatch(snackbar.state.text.value, /Server error|unknownCode|internal/);
    }
  }
});

test('info messages are still shown unchanged', () => {
  const snackbar = mountSnackbar();
  snackbar.infoMessage('Saved');
  assert.equal(snackbar.state.snackbar.value, true);
  assert.equal(snackbar.state.text.value, 'Saved');
});
