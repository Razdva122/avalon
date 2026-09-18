const { test } = require('node:test');
const assert = require('node:assert/strict');
const { routesSeo } = require('../src/router/seo');
const { isNeutralPath, localizedPath } = require('../src/router/paths');

test('support and community are public, indexable, prerendered pages in all six languages', () => {
  for (const name of ['support', 'community']) {
    const route = routesSeo[name];
    assert.equal(route.meta.prerender, true, name);
    assert.equal(Boolean(route.meta.skipSiteMap), false, name);
    assert.equal(Object.keys(route.meta.multiLanguage).length, 6);
    for (const language of Object.keys(route.meta.multiLanguage)) {
      assert.equal(isNeutralPath(localizedPath(route.path, language)), false);
    }
  }
});
