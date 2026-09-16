const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

// Test the actual HTML delivered to crawlers, without executing JavaScript.
const dist = path.resolve(__dirname, '../dist');
function graphAt(route) {
  const html = fs.readFileSync(path.join(dist, route, 'index.html'), 'utf8');
  const documents = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .filter((match) => match[1].trim())
    .map((match) => JSON.parse(match[1]));
  return documents.flatMap((doc) => doc['@graph'] || [doc]);
}

test('home describes the website and free browser game with stable linked identities', () => {
  const graph = graphAt('/');
  const site = graph.find((node) => node['@type'] === 'WebSite');
  assert(site, 'Missing WebSite in delivered HTML');
  assert.equal(site['@id'], 'https://avalon-game.com/#website');
  const game = graph.find((node) => node['@type'] === 'WebApplication');
  assert(game, 'Missing WebApplication in delivered HTML');
  assert.equal(game['@id'], 'https://avalon-game.com/#game');
  assert.equal(game.isAccessibleForFree, true);
  assert.equal(game.applicationCategory, 'GameApplication');
  const page = graph.find((node) => node['@type'] === 'WebPage');
  assert.equal(page.mainEntity['@id'], game['@id']);
  assert.equal(page.isPartOf['@id'], site['@id']);
});

test('localized rules describe their own URL and language while retaining breadcrumbs', () => {
  const graph = graphAt('/ru/wiki/rules/');
  const page = graph.find((node) => node['@type'] === 'WebPage');
  assert(page, 'Missing localized WebPage in delivered HTML');
  assert.equal(page.url, 'https://avalon-game.com/ru/wiki/rules/');
  assert.equal(page.inLanguage, 'ru');
  assert.match(page.name, /[А-Яа-я]/);
  assert.equal(page.about['@id'], 'https://avalon-game.com/#game');
  const breadcrumbs = graph.find((node) => node['@type'] === 'BreadcrumbList');
  assert(breadcrumbs, 'Breadcrumbs must coexist with page data');
  assert.equal(page.breadcrumb['@id'], breadcrumbs['@id']);
  assert.equal(breadcrumbs.itemListElement.at(-1).item, page.url);
});

test('404 page does not describe itself as an indexable public page or game', () => {
  assert.equal(graphAt('/404/').length, 0);
});

const { routesSeo } = require('../src/router/seo');
const { localizedPath } = require('../src/router/paths');
for (const route of Object.values(routesSeo).filter((route) => route.meta.prerender && !route.meta.skipSiteMap)) {
  for (const [language, meta] of Object.entries(route.meta.multiLanguage)) {
    const pathname = localizedPath(route.path, language);
    test(`${pathname}: public page has unique, localized structured data`, () => {
      const graph = graphAt(pathname);
      const pages = graph.filter((node) => node['@type'] === 'WebPage');
      assert.equal(pages.length, 1);
      assert.equal(pages[0].url, 'https://avalon-game.com' + pathname);
      assert.equal(pages[0].inLanguage, language);
      assert.equal(pages[0].name, meta.title);
      assert.equal(pages[0].description, meta.description);
      assert.equal(new Set(graph.map((node) => node['@id'])).size, graph.length, 'Duplicate entity IDs');
      if (route.path.startsWith('/wiki/') && route.path !== '/wiki/') {
        const breadcrumbs = graph.find((node) => node['@type'] === 'BreadcrumbList');
        assert(breadcrumbs, 'Missing breadcrumbs');
        assert.equal(pages[0].breadcrumb['@id'], breadcrumbs['@id']);
        assert.equal(breadcrumbs.itemListElement.at(-1).item, pages[0].url);
      }
    });
  }
}
