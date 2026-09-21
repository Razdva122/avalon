const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parse, compileScript } = require('@vue/compiler-sfc');
const ts = require('typescript');
const { renderToString } = require('@vue/server-renderer');

// Compile the real components, replacing only image URL resolution and translations.
function component(relative, mounted = []) {
  const filename = path.resolve(__dirname, '../src', relative);
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  const script = compileScript(descriptor, { id: filename, inlineTemplate: true });
  const code = ts.transpileModule(script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (id) => {
    if (id === 'vue') return { ...require('vue'), onMounted: (callback) => mounted.push(callback) };
    if (id === 'vue-i18n') return { useI18n: () => ({ t: (key) => key }) };
    if (id === '@/helpers/images') return { getImagePathByID: (kind, id) => `/${kind}/${id}.webp` };
    if (id.endsWith('.vue')) {
      return {
        default: component(
          id.startsWith('@/')
            ? id.slice(2)
            : path.relative(path.resolve(__dirname, '../src'), path.resolve(path.dirname(filename), id)),
        ),
      };
    }
    return require(id);
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports.default;
}

test('benefits preserve marketing text but mount images only after first open, retaining them on close', async () => {
  const benefits = component('pages/support/SupportBenefits.vue');
  const render = benefits.setup({ active: false }, { expose() {} });
  const html = () => {
    const vnode = render({ active: false }, []);
    // Sticker translations use the global $t helper.
    const { createSSRApp } = require('vue');
    const app = createSSRApp({ render: () => vnode });
    app.component('router-link', { render: () => null });
    app.config.globalProperties.$t = (key) => key;
    return renderToString(app);
  };
  const initial = await html();
  assert.match(initial, /support\.premiumTitle/);
  assert.match(initial, /premiumCosmetics\.puppeteer/);
  assert.doesNotMatch(initial, /<img\b/);
  const toggle = render({ active: false }, []).props.onToggle;
  toggle({ target: { open: false } });
  assert.doesNotMatch(await html(), /<img\b/);
  toggle({ target: { open: true } });
  assert.equal(((await html()).match(/<img\b/g) || []).length, 4);
  toggle({ target: { open: false } });
  assert.equal(((await html()).match(/<img\b/g) || []).length, 4);
});

test('an already opened prerendered disclosure activates images when hydration mounts', () => {
  const mounted = [];
  const benefits = component('pages/support/SupportBenefits.vue', mounted);
  const render = benefits.setup({ active: false }, { expose() {} });
  const vnode = render({ active: false }, []);
  assert.ok(vnode.ref, 'native details state must be read during mount');
  vnode.ref.r.value = { open: true };
  for (const callback of mounted) callback();
  const collection = render({ active: false }, []).children[1].children.at(-1);
  assert.equal(collection.props['images-visible'], true);
});
