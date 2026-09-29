const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');
const { parse } = require('@vue/compiler-sfc');
function load(name, imports) {
  const source = fs.readFileSync(`${__dirname}/../src/components/${name}.vue`, 'utf8');
  const { descriptor } = parse(source);
  const code = ts.transpileModule(descriptor.script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    (id) => (id === 'vue' ? vue : imports[id] || {}),
    module,
    module.exports,
  );
  return module.exports.default;
}
test('dark theme switch reflects the saved setting and updates both appearance and preference', () => {
  const state = vue.reactive({ settings: { colorTheme: 'light' } });
  const name = vue.ref('lightTheme');
  const store = {
    state,
    commit(type, payload) {
      assert.equal(type, 'updateUserSettings');
      state.settings[payload.key] = payload.value;
    },
  };
  const component = load('feedback/ThemeToggle', {
    '@/store': { useStore: () => store },
    vuetify: { useTheme: () => ({ global: { name } }) },
  });
  const toggle = component.setup();
  assert.equal(toggle.isDark?.value, false);
  toggle.toggleTheme();
  assert.equal(toggle.isDark.value, true);
  assert.equal(name.value, 'darkTheme');
  assert.equal(state.settings.colorTheme, 'dark');
  toggle.toggleTheme();
  assert.equal(toggle.isDark.value, false);
  assert.equal(name.value, 'lightTheme');
});
