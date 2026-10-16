const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parse, compileScript } = require('@vue/compiler-sfc');
const ts = require('typescript');
const { createSSRApp, createRenderer, h, nextTick } = require('vue');
const { renderToString } = require('@vue/server-renderer');
const { createRouter, createMemoryHistory, RouterView } = require('vue-router');
const { createI18n } = require('vue-i18n');
const { routesSeo } = require('../src/router/seo');
const root = path.resolve(__dirname, '../src');

const guideEvents = [];
const modules = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const filename = path.join(root, file);
  assert.ok(fs.existsSync(filename), `The guide implementation is missing: ${file}`);
  const source = fs.readFileSync(filename, 'utf8');
  const code = file.endsWith('.vue')
    ? compileScript(parse(source, { filename }).descriptor, { id: filename, inlineTemplate: true }).content
    : source;
  const compiled = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const result = { exports: {} };
  modules.set(file, result);
  new Function('require', 'module', 'exports', compiled)(
    (id) => {
      if (id.startsWith('.')) {
        const target = path.resolve(path.dirname(filename), id);
        const relative = path.relative(
          root,
          fs.existsSync(target + '.ts') ? target + '.ts' : path.join(target, 'index.ts'),
        );
        return load(relative);
      }
      if (id === '@/router/paths') return require('../src/router/paths');
      if (id === '@/components/feedback/LocaleLink.vue') return load('components/feedback/LocaleLink.vue');
      // Webpack supplies these URLs; SSR does not execute browser analytics.
      if (id === '@/helpers/images') return { getImagePathByID: () => '/assets/preview.webp' };
      if (id === '@/helpers/acquisition')
        return { trackGuideVisit: (...args) => guideEvents.push(args), trackGuideCta() {} };
      return require(id);
    },
    result,
    result.exports,
  );
  return result.exports;
}

const ids = ['social_deduction_games_online', 'games_like_secret_hitler', 'avalon_vs_werewolf'];

test('game discovery links expose all three guides in the reader’s language without loading articles', async () => {
  const GameGuideLinks = load('components/view/information/GameGuideLinks.vue').default;
  const { wiki } = load('i18n/langs/pages/wiki.ts');
  const { localizedPath } = require('../src/router/paths');
  for (const locale of Object.keys(wiki)) {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        ...ids.map((name) => ({ name, path: routesSeo[name].path, component: { render: () => null } })),
        { path: '/:pathMatch(.*)*', component: { render: () => null } },
      ],
    });
    await router.push(localizedPath('/wiki/', locale));
    const app = createSSRApp(GameGuideLinks);
    app.use(router);
    app.use(createI18n({ legacy: false, locale, messages: { [locale]: { wiki: wiki[locale] } } }));
    const html = await renderToString(app);
    assert.ok(html.includes(wiki[locale].gameGuides), `${locale}: section heading`);
    assert.equal((html.match(/<a\b/g) || []).length, 3, `${locale}: all guides directly reachable`);
    for (const name of ids) {
      assert.ok(html.includes(`href="${localizedPath(routesSeo[name].path, locale)}"`), `${locale}: ${name}`);
    }
    assert.ok(!html.includes('wiki.guide') && !html.includes('[object Object]'), `${locale}: readable labels`);
  }
});

test('each public guide renders an accessible comparison and actionable English links on the server', async () => {
  const Guide = load('pages/guides/Guide.vue').default;
  for (const guide of ids) {
    const app = createSSRApp(Guide, { guide });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
    });
    app.use(router);
    await router.push(`/guides/${guide.replaceAll('_', '-')}/`);
    await router.isReady();
    const html = await renderToString(app);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, guide);
    assert.match(html, /<h1[^>]*>[^<]+<\/h1>/, `${guide}: readable heading`);
    assert.match(html, /<caption[^>]*>[^<]+<\/caption>/, `${guide}: table caption`);
    assert.match(html, /<th[^>]+scope="col"/, `${guide}: column headers`);
    assert.match(html, /<th[^>]+scope="row"/, `${guide}: row headers`);
    for (const href of ['/', '/#play-with-ai', '/wiki/rules/', '/community/players/', '/community/groups/']) {
      assert.ok(html.includes(`href="${href}"`), `${guide}: ${href}`);
    }
    assert.match(html, /aria-labelledby="setup-title"/, `${guide}: visible setup panel`);
    const humanSetup = html.match(/<section[^>]+aria-labelledby="human-setup-title"[^>]*>([\s\S]*?)<\/section>/);
    const aiSetup = html.match(/<section[^>]+aria-labelledby="ai-setup-title"[^>]*>([\s\S]*?)<\/section>/);
    assert.ok(humanSetup && aiSetup, `${guide}: distinct human and AI setup sections`);
    assert.ok(!html.includes('[object Object]') && !html.includes('{{'), `${guide}: no unresolved data`);
    assert.match(html, /<a[^>]+href="https:\/\//, `${guide}: external evidence`);
    assert.match(html, /aria-current="page"/, `${guide}: current breadcrumb`);
  }
});

// Route changes must select the translated data before SSR/hydration and preserve links.
test('all translated guides render complete articles with locale-preserving play and related links', async () => {
  const Guide = load('pages/guides/Guide.vue').default;
  const { loadGuideLocale } = load('pages/guides/locales/index.ts');
  const locales = [
    ['en', ''],
    ['ru', '/ru'],
    ['es', '/es'],
    ['pt', '/pt'],
    ['vi', '/vi'],
    ['zh-CN', '/zh-cn'],
    ['zh-TW', '/zh-tw'],
  ];
  for (const [language, prefix] of locales) {
    await loadGuideLocale(language);
    for (const [index, guide] of ids.entries()) {
      const pathname = `${prefix}/guides/${guide.replaceAll('_', '-')}/`;
      const app = createSSRApp(Guide, { guide });
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/:pathMatch(.*)*', meta: { lang: language }, component: { render: () => null } }],
      });
      app.use(router);
      await router.push(pathname);
      await router.isReady();
      const html = await renderToString(app);
      assert.ok(html.includes(`lang="${language}"`), pathname);
      assert.ok(html.includes(`href="${prefix}/#play-with-ai"`), pathname);
      for (const link of ['/wiki/rules/', '/community/groups/', '/community/players/', '/wiki/roles/merlin/']) {
        assert.ok(html.includes(`href="${prefix}${link}"`), pathname + link);
      }
      assert.equal((html.match(/aria-labelledby="guide-section-/g) || []).length, [6, 6, 7][index], pathname);
      assert.equal((html.match(/scope="row"/g) || []).length, [4, 5, 5][index], pathname);
      assert.equal((html.match(/<h1\b/g) || []).length, 1, pathname);
      assert.ok(!html.includes('[object Object]') && !html.includes('{{'), pathname);
      // Readers can jump to every article section; no dead fragment links or untranslated navigation.
      const toc = html.match(/<details[^>]*class="guide-toc"[^>]*>([\s\S]*?)<\/details>/);
      assert.ok(toc, `${pathname}: article contents navigation`);
      const fragments = [...toc[1].matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
      assert.ok(fragments.includes('guide-comparison') && fragments.includes('guide-play'), pathname);
      for (const fragment of fragments) assert.ok(html.includes(`id="${fragment}"`), `${pathname}: ${fragment}`);
      assert.ok(html.indexOf('id="guide-comparison"') < html.indexOf('id="setup-title"'), pathname);
      const cards = html.match(/<div[^>]*class="guide-cards"[^>]*>([\s\S]*?)<\/div>/);
      assert.ok(cards, `${pathname}: mobile comparison`);
      assert.equal((cards[1].match(/<dl\b/g) || []).length, [4, 5, 5][index], pathname);
      assert.equal((cards[1].match(/<dt\b/g) || []).length, [8, 10, 10][index], pathname);
      assert.equal((cards[1].match(/<dd\b/g) || []).length, [8, 10, 10][index], pathname);
      if (language !== 'en') {
        assert.ok(!html.includes('Play solo or invite friends'), pathname);
        assert.ok(!html.includes('Game names belong to their respective owners.'), pathname);
        assert.ok(!toc[1].includes('In this article'), pathname);
      }
      for (const other of ids.filter((id) => id !== guide)) {
        assert.ok(html.includes(`href="${prefix}/guides/${other.replaceAll('_', '-')}/"`), pathname);
      }
    }
  }
});

// Uses Vue's renderer and real router; no browser/network service is needed to test reused components.
test('switching the same guide to another locale records a visit for the new canonical version', async () => {
  const Guide = load('pages/guides/Guide.vue').default;
  const { loadGuideLocale } = load('pages/guides/locales/index.ts');
  const element = () => ({ children: [], parent: null });
  const renderer = createRenderer({
    createElement: element,
    createText: element,
    createComment: element,
    setText() {},
    setElementText() {},
    patchProp() {},
    insert(node, parent) {
      node.parent = parent;
      parent.children.push(node);
    },
    remove(node) {
      if (node.parent) node.parent.children = node.parent.children.filter((child) => child !== node);
    },
    parentNode: (node) => node.parent,
    nextSibling: () => null,
  });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/guides/avalon-vs-werewolf/',
        component: Guide,
        props: { guide: 'avalon_vs_werewolf' },
        meta: { lang: 'en' },
      },
      {
        path: '/ru/guides/avalon-vs-werewolf/',
        component: Guide,
        props: { guide: 'avalon_vs_werewolf' },
        meta: { lang: 'ru' },
      },
      { path: '/:pathMatch(.*)*', component: { render: () => null } },
    ],
  });
  router.beforeResolve((to) => loadGuideLocale(to.meta.lang || 'en'));
  const app = renderer.createApp({ render: () => h(RouterView) });
  app.use(router);
  await router.push('/guides/avalon-vs-werewolf/');
  await router.isReady();
  guideEvents.length = 0;
  app.mount(element());
  await nextTick();
  await router.push('/ru/guides/avalon-vs-werewolf/');
  await nextTick();
  assert.deepEqual(guideEvents, [
    ['avalon-vs-werewolf', 'en'],
    ['avalon-vs-werewolf', 'ru'],
  ]);
  app.unmount();
});
