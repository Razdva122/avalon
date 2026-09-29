const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parse, compileScript } = require('@vue/compiler-sfc');
const ts = require('typescript');
const { createSSRApp, compile } = require('vue');
const { renderToString } = require('@vue/server-renderer');
const root = path.resolve(__dirname, '../src');

function component(file) {
  const filename = path.join(root, file);
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  const script = compileScript(descriptor, { id: filename, inlineTemplate: true });
  const code = ts.transpileModule(script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    (id) => {
      if (id.endsWith('SchemaImage.vue')) return { default: component('components/view/SchemaImage.vue') };
      // Text interpolation is verified by the production SEO build checks.
      if (id.endsWith('LocalizedTextWrapper.vue')) return { default: { render: () => null } };
      if (id === '@/helpers/styles') return { calculateRoleUrl: (role) => `/roles/${role}.webp` };
      return require(id);
    },
    module,
    module.exports,
  );
  const result = module.exports.default;
  if (!descriptor.scriptSetup) result.render = compile(descriptor.template.content);
  return result;
}

test('paired role guides render both real character portraits with localized alternative text', async () => {
  const Guide = component('components/view/information/WikiRoleGuide.vue');
  for (const [role, portraits] of [
    ['lancelots', ['goodLancelot', 'evilLancelot']],
    ['lovers', ['tristan', 'isolde']],
    ['merlinPure', ['merlinPure']],
  ]) {
    const app = createSSRApp(Guide, { role });
    app.config.globalProperties.$t = (key) => `translated:${key}`;
    app.component('LocaleLink', { template: '<a><slot /></a>' });
    const html = await renderToString(app);
    assert.equal((html.match(/<img\b/g) || []).length, portraits.length, role);
    for (const portrait of portraits) {
      assert.ok(html.includes(`src="/roles/${portrait}.webp"`), `${role}: ${portrait}`);
      assert.ok(html.includes(`alt="translated:roles.${portrait}"`), `${role}: localized alt`);
    }
  }
});
