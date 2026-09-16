const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const dist = path.resolve(__dirname, '../dist');
const files = fs.readdirSync(path.join(dist, 'js'));
const maps = files.filter((file) => file.endsWith('.map'));
assert(maps.length, 'Source maps are required for the client dependency audit');
for (const file of maps) {
  const map = JSON.parse(fs.readFileSync(path.join(dist, 'js', file), 'utf8'));
  for (const source of map.sources) {
    assert(!/node_modules\/(?:mongoose|@typegoose|mongodb)\//.test(source), `${file}: server dependency ${source}`);
    assert(!/node_modules\/lodash\/lodash\.js/.test(source), `${file}: full Lodash import`);
    assert(!/src\/i18n\/langs\/pages\/(?!seo\/)/.test(source), `${file}: unsplit page dictionaries`);
    if (/^(app|chunk-vendors)\./.test(file)) {
      assert(!source.includes('/i18n/generated/'), `${file}: locale dictionary in startup bundle`);
      assert(!source.includes('@vue/server-renderer'), `${file}: build renderer in startup bundle`);
    }
  }
}
const initial = files.filter((file) => /^(app|chunk-vendors)\..*\.js$/.test(file));
const gzipBytes = initial.reduce(
  (sum, file) => sum + zlib.gzipSync(fs.readFileSync(path.join(dist, 'js', file))).length,
  0,
);
assert(gzipBytes < 300 * 1024, `Initial JavaScript exceeds 300 KiB gzip: ${gzipBytes}`);
const localeSizes = Object.fromEntries(
  ['en', 'ru', 'es', 'pt', 'zh-cn', 'zh-tw'].map((language) => {
    const chunks = files.filter((file) => file.startsWith(`locale-${language}.`) && file.endsWith('.js'));
    assert.equal(chunks.length, 1, `${language}: expected one independent locale chunk`);
    return [language, zlib.gzipSync(fs.readFileSync(path.join(dist, 'js', chunks[0]))).length];
  }),
);
for (const [language, bytes] of Object.entries(localeSizes)) {
  const startup = gzipBytes + localeSizes.en + (language === 'en' ? 0 : bytes);
  assert(startup < 365 * 1024, `${language}: startup plus dictionaries exceeds 365 KiB gzip`);
}
const css = fs
  .readdirSync(path.join(dist, 'css'))
  .map((file) => fs.readFileSync(path.join(dist, 'css', file), 'utf8'))
  .join('\n');
assert(!css.includes('Font Awesome'), 'Full icon font stylesheet has returned');
console.log(
  `Bundle checks passed: no database runtime/full Lodash, initial JS ${(gzipBytes / 1024).toFixed(1)} KiB gzip; with English ${((gzipBytes + localeSizes.en) / 1024).toFixed(1)} KiB.`,
);
