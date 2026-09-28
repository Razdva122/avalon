const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parse, compileScript } = require('@vue/compiler-sfc');
const ts = require('typescript');
const { createSSRApp, compile } = require('vue');
const { renderToString } = require('@vue/server-renderer');
const { createRouter, createMemoryHistory } = require('vue-router');
const { createI18n } = require('vue-i18n');
const { routesSeo } = require('../src/router/seo');
const root = path.resolve(__dirname, '../src');
const leaf = { render: () => null };
const translationsModule = { exports: {} };
new Function(
  'exports',
  ts.transpileModule(fs.readFileSync(path.join(root, 'i18n/langs/pages/wikiPlay.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
)(translationsModule.exports);
const messages = Object.fromEntries(
  Object.entries(translationsModule.exports.wikiPlay).map(([locale, wikiPlay]) => [locale, { wikiPlay }]),
);

// Keep real page templates, CTA, LocaleLink, router and i18n; omit unrelated
// portraits/player-stat widgets, which depend on browser or backend services.
function component(relative) {
  const filename = path.join(root, relative);
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  const script = compileScript(descriptor, { id: filename, inlineTemplate: true });
  const code = ts.transpileModule(script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (id) => {
    if (id.endsWith('.vue')) {
      return { default: /WikiPlayCta|LocaleLink/.test(id) ? component(id.slice(2)) : leaf };
    }
    if (id === '@/helpers/styles') return { calculateRoleUrl: () => '/role.webp' };
    if (id === '@/router/paths') return require('../src/router/paths');
    return require(id);
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  const result = module.exports.default;
  if (!descriptor.scriptSetup) result.render = compile(descriptor.template.content);
  return result;
}

async function renderPage(file, locale, prefix, props = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: Object.entries(routesSeo).map(([name, route]) => ({ name, path: route.path, component: leaf })),
  });
  // Localized routes are needed for RouterLink's real resolution.
  if (prefix) {
    for (const route of Object.values(routesSeo)) router.addRoute({ path: prefix + route.path, component: leaf });
  }
  await router.push(prefix + '/wiki/roles/');
  const app = createSSRApp(component(file), props);
  app.use(router);
  app.use(createI18n({ legacy: false, locale, missingWarn: false, fallbackWarn: false, messages }));
  app.component('LocaleLink', component('components/feedback/LocaleLink.vue'));
  return renderToString(app);
}

test('every role article and the roles index render one bottom CTA with locale-preserving lobby and rules links', async () => {
  for (const [locale, prefix] of [
    ['en', ''],
    ['ru', '/ru'],
    ['es', '/es'],
    ['pt', '/pt'],
    ['zh-CN', '/zh-cn'],
    ['zh-TW', '/zh-tw'],
  ]) {
    for (const file of fs.readdirSync(path.join(root, 'pages/wiki/roles')).filter((file) => file.endsWith('.vue'))) {
      const html = await renderPage(`pages/wiki/roles/${file}`, locale, prefix);
      assert.equal((html.match(/class="wiki-play-cta"/g) || []).length, 1, `${locale}/${file}`);
      const cta = html.slice(html.indexOf('class="wiki-play-cta"'));
      assert.match(cta, new RegExp(`href="${prefix}/"`));
      assert.match(cta, new RegExp(`href="${prefix}/wiki/rules/"`));
      assert.doesNotMatch(
        cta.slice(cta.indexOf('</aside>') + 8),
        /<(?:h[1-6]|p|section|nav)\b/,
        'article content must precede the CTA',
      );
      assert.doesNotMatch(cta, /wikiPlay\./, 'CTA copy must resolve in every language');
    }
  }
});

test('the rules page can omit a redundant rules link while keeping the lobby action', async () => {
  const html = await renderPage('components/view/information/WikiPlayCta.vue', 'ru', '/ru', { showRules: false });
  assert.match(html, /href="\/ru\/"/);
  assert.doesNotMatch(html, /href="\/ru\/wiki\/rules\/"/);
});
