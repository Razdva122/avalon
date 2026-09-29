const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { inNavigationSection } = require('../src/components/header/navigation.ts');
test('navigation highlights localized descendants, without matching unrelated prefixes', () => {
  assert.equal(inNavigationSection('/ru/community/players/', '/community/'), true);
  assert.equal(inNavigationSection('/zh-tw/wiki/roles/merlin/', '/wiki/'), true);
  assert.equal(inNavigationSection('/ru/wiki/', '/wiki/'), true);
  assert.equal(inNavigationSection('/ru/', '/'), true);
  assert.equal(inNavigationSection('/ru/community/players/', '/'), false);
  assert.equal(inNavigationSection('/community-other/', '/community/'), false);
});
