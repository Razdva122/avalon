const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { ref, nextTick } = require('vue');

function loadPlugin(locale, onLoad = () => {}) {
  const filename = path.resolve(__dirname, '../src/plugins/vuetify/index.ts');
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded.require = (id) => {
    if (id === 'vuetify/styles') return {};
    if (id === './icons') return { fa: {} };
    if (id === '@/helpers/prerender') return { hydratePage: false, ssrPage: false };
    if (id === '@/store/init') return { userSettingsInStorage: null };
    if (id === '@/plugins/i18n') return { i18n: { global: { locale } } };
    if (id === './vi') {
      onLoad();
      const translated = new Module(path.join(path.dirname(filename), 'vi.ts'), module);
      translated.paths = module.paths;
      translated._compile(
        ts.transpileModule(fs.readFileSync(translated.id, 'utf8'), {
          compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
        }).outputText,
        translated.id,
      );
      return translated.exports;
    }
    return require(id);
  };
  loaded._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText,
    filename,
  );
  return loaded.exports;
}

test('framework controls use Vietnamese on initial load and follow language changes', async () => {
  const locale = ref('vi');
  const { vuetify, syncVuetifyLanguage } = loadPlugin(locale);
  await syncVuetifyLanguage();
  assert.equal(vuetify.locale.current.value, 'vi');
  assert.equal(vuetify.locale.t('$vuetify.noDataText'), 'Không có dữ liệu');
  assert.equal(vuetify.locale.t('$vuetify.input.clear', 'Tên'), 'Xóa Tên');
  assert.equal(vuetify.locale.t('$vuetify.pagination.ariaLabel.first'), 'Trang đầu');
  locale.value = 'en';
  await nextTick();
  assert.equal(vuetify.locale.t('$vuetify.noDataText'), 'No data available');
  locale.value = 'vi';
  await nextTick();
  await syncVuetifyLanguage();
  assert.equal(vuetify.locale.t('$vuetify.noDataText'), 'Không có dữ liệu');
});

test('non-Vietnamese startup skips the framework dictionary and later switches reuse it', async () => {
  let loads = 0;
  const locale = ref('ru');
  const { vuetify, syncVuetifyLanguage } = loadPlugin(locale, () => loads++);
  await syncVuetifyLanguage();
  assert.equal(loads, 0);
  assert.equal(vuetify.locale.current.value, 'en');
  locale.value = 'vi';
  await syncVuetifyLanguage();
  assert.equal(loads, 1);
  assert.equal(vuetify.locale.t('$vuetify.input.clear', 'Tên'), 'Xóa Tên');
  locale.value = 'ru';
  await syncVuetifyLanguage();
  locale.value = 'vi';
  await syncVuetifyLanguage();
  assert.equal(loads, 1);
});
