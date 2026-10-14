const { test } = require('node:test');
const assert = require('node:assert/strict');
const { imageGenerator } = require('../image-storage.cjs');

test('production image references resolve to the application host, including nested pages', () => {
  const generator = imageGenerator({ NODE_ENV: 'production' });
  const image = generator.publicPath + 'img/merlin.0123456789abcdef.webp';
  for (const page of ['https://avalon-game.com/', 'https://avalon-game.com/ru/wiki/roles/merlin/']) {
    assert.equal(new URL(image, page).href, 'https://avalon-game.com/img/merlin.0123456789abcdef.webp');
  }
});
