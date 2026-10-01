const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');
const { parse, compileTemplate } = require('@vue/compiler-sfc');
const { renderToString } = require('@vue/server-renderer');
test('room renders loading safely when reconnect cancels its first pending join', async () => {
  const filename = require.resolve('../src/pages/room/Room.vue');
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'));
  const compiled = compileTemplate({
    source: descriptor.template.content,
    filename,
    id: 'test',
    ssr: true,
    ssrCssVars: [],
    compilerOptions: { isCustomElement: () => true },
  });
  const exports = {};
  new Function(
    'require',
    'exports',
    ts.transpileModule(compiled.code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  )(require, exports);
  const app = vue.createSSRApp({
    ssrRender: exports.ssrRender,
    setup: () => ({ roomState: undefined, errorMessage: undefined, online: 0 }),
  });
  app.config.globalProperties.$t = (key) => key;
  const html = await renderToString(app);
  assert.match(html, /mainPage.loading/);
});
