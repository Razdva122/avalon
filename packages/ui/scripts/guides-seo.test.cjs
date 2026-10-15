const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { routesSeo } = require('../src/router/seo');
const paths = require('../src/router/paths');

const guidePaths = {
  social_deduction_games_online: '/guides/social-deduction-games-online/',
  games_like_secret_hitler: '/guides/games-like-secret-hitler/',
  avalon_vs_werewolf: '/guides/avalon-vs-werewolf/',
};

test('translated guides expose all seven public locales with real breadcrumb targets', () => {
  for (const [name, pathname] of Object.entries(guidePaths)) {
    const route = routesSeo[name];
    assert.ok(route, `${name}: public guide must be registered`);
    assert.equal(route.path, pathname);
    assert.equal(route.meta.prerender, true);
    assert.equal(Boolean(route.meta.skipSiteMap), false);
    assert.deepEqual(Object.keys(route.meta.multiLanguage).sort(), ['en', 'es', 'pt', 'ru', 'vi', 'zh-CN', 'zh-TW']);
    assert.equal(paths.isNeutralPath(pathname), false);
    for (const [language, meta] of Object.entries(route.meta.multiLanguage)) {
      const prefix = language === 'en' ? '' : '/' + language.toLowerCase();
      assert.ok(meta.title.trim() && meta.description.trim() && meta.keywords.length);
      assert.equal(meta.breadcrumbs[0].to, prefix + '/');
      assert.equal(meta.breadcrumbs.at(-1).to, prefix + pathname);
      assert.deepEqual(
        paths.languageSwitchTarget(pathname, language, Object.keys(route.meta.multiLanguage), '#next-title'),
        {
          path: prefix + pathname,
          hash: '#next-title',
        },
      );
    }
    assert.equal(route.meta.breadcrumbs[0].to, '/');
    assert.equal(route.meta.breadcrumbs.at(-1).to, pathname);
    if (name !== 'social_deduction_games_online') {
      assert.equal(route.meta.breadcrumbs[1].to, '/guides/social-deduction-games-online/');
    }
    for (const crumb of route.meta.breadcrumbs) {
      assert.ok(Object.values(routesSeo).some((target) => target.path === crumb.to));
      assert.ok(crumb.title.trim());
    }
  }
});

test('explicit language switching uses the locale home when this page has no translation and drops its fragment', () => {
  assert.equal(typeof paths.languageSwitchTarget, 'function', 'locale switching needs an availability-aware target');
  assert.deepEqual(paths.languageSwitchTarget('/guides/avalon-vs-werewolf/', 'ru', ['en'], '#comparison'), {
    path: '/ru/',
    hash: '',
  });
  assert.deepEqual(paths.languageSwitchTarget('/guides/avalon-vs-werewolf/', 'zh-TW', ['en'], '#comparison'), {
    path: '/zh-tw/',
    hash: '',
  });
  assert.deepEqual(paths.languageSwitchTarget('/guides/avalon-vs-werewolf/', 'en', ['en'], '#comparison'), {
    path: '/guides/avalon-vs-werewolf/',
    hash: '#comparison',
  });
  assert.deepEqual(paths.languageSwitchTarget('/ru/wiki/rules/', 'zh-TW', ['en', 'ru', 'zh-TW'], '#winning'), {
    path: '/zh-tw/wiki/rules/',
    hash: '#winning',
  });
  assert.deepEqual(paths.languageSwitchTarget('/wiki/rules/', 'ru', undefined, '#winning'), {
    path: '/ru/wiki/rules/',
    hash: '#winning',
  });
});

test('direct guide visits hydrate their prerendered article instead of replacing it', () => {
  const filename = path.resolve(__dirname, '../src/helpers/prerender.ts');
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  for (const pathname of Object.values(guidePaths).flatMap((path) =>
    ['', '/ru', '/es', '/pt', '/zh-cn', '/zh-tw', '/vi'].map((prefix) => prefix + path),
  )) {
    const exports = {};
    new Function('require', 'exports', 'window', 'document', code)(
      (id) => (id === '@/router/paths' ? paths : require(id)),
      exports,
      { location: { pathname } },
      { querySelector: () => ({ dataset: { ssrPath: pathname } }) },
    );
    assert.equal(exports.article, true, pathname);
    assert.equal(exports.ssrPage, true, pathname);
    assert.equal(exports.hydratePage, true, pathname);
  }
});
