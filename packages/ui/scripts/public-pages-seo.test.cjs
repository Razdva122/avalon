const { test } = require('node:test');
const assert = require('node:assert/strict');
const { routesSeo } = require('../src/router/seo');
const { isNeutralPath, localizedPath } = require('../src/router/paths');

test('support and community are public, indexable, prerendered pages in all seven languages', () => {
  for (const name of ['support', 'community', 'community_solo', 'community_group']) {
    const route = routesSeo[name];
    assert.equal(route.meta.prerender, true, name);
    assert.equal(Boolean(route.meta.skipSiteMap), false, name);
    assert.equal(Object.keys(route.meta.multiLanguage).length, 7);
    for (const language of Object.keys(route.meta.multiLanguage)) {
      assert.equal(isNeutralPath(localizedPath(route.path, language)), false);
    }
  }
});

test('contact and privacy have public English routes that prerender into the sitemap', () => {
  for (const name of ['contact', 'privacy']) {
    const route = routesSeo[name];
    assert.equal(route.path, `/${name}/`);
    assert.equal(route.meta.prerender, true);
    assert.equal(Boolean(route.meta.skipSiteMap), false);
    assert.deepEqual(Object.keys(route.meta.multiLanguage), ['en']);
  }
});
