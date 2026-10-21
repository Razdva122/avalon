const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Vue = require('vue');
const { parse, compileScript } = require('@vue/compiler-sfc');
const { renderToString } = require('@vue/server-renderer');
const { createI18n } = require('vue-i18n');
const { createRouter, createMemoryHistory } = require('vue-router');
const root = path.resolve(__dirname, '../src');
function component(relative) {
  const filename = path.join(root, relative);
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  const script = compileScript(descriptor, { id: relative, inlineTemplate: true });
  const module = { exports: {} };
  const localRequire = (id) => {
    if (/PlayerIcon|AddonIcon/.test(id)) return { __esModule: true, default: { render: () => null } };
    if (id.endsWith('.vue')) return { __esModule: true, default: component(id.slice(2)) };
    if (id === '@/components/view/information/const') return { rolesShortInfo: {} };
    if (id === '@/router/paths') return require('../src/router/paths');
    return require(id);
  };
  new Function(
    'require',
    'module',
    'exports',
    ts.transpileModule(script.content, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } })
      .outputText,
  )(localRequire, module, module.exports);
  if (!descriptor.scriptSetup) module.exports.default.render = Vue.compile(descriptor.template.content);
  return module.exports.default;
}

test('inline expansion links resolve repeated Trapper mentions to its dedicated page in every locale', async () => {
  for (const locale of ['en', 'ru', 'es', 'pt', 'vi', 'zh-CN', 'zh-TW']) {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        ...['trapper', 'excalibur'].map((name) => ({
          name,
          path: `/wiki/expansions/${name}/`,
          component: { render: () => null },
        })),
        { name: 'rules', path: '/wiki/rules/', component: { render: () => null } },
        { path: '/:pathMatch(.*)*', component: { render: () => null } },
      ],
    });
    await router.push('/');
    const app = Vue.createSSRApp(component('components/feedback/LocalizedTextWrapper.vue'), { keypath: 'copy' });
    app.use(router);
    app.use(
      createI18n({
        legacy: false,
        locale,
        messages: {
          [locale]: {
            copy: '{trapper} + {excalibur} + {trapper}',
            trapper: { name: 'Trapper' },
            addons: { excalibur: 'Excalibur' },
          },
        },
      }),
    );
    app.component('LocaleLink', component('components/feedback/LocaleLink.vue'));
    const html = await renderToString(app);
    const prefix = locale === 'en' ? '' : `/${locale.toLowerCase()}`;
    assert.equal(html.split(`href="${prefix}/wiki/expansions/trapper/"`).length - 1, 2, locale);
    assert.ok(html.includes(`href="${prefix}/wiki/expansions/excalibur/"`));
    assert.doesNotMatch(html, /#trapper/);
  }
});
