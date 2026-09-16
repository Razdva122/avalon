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
  }
}
const initial = files.filter((file) => /^(app|chunk-vendors)\..*\.js$/.test(file));
const gzipBytes = initial.reduce(
  (sum, file) => sum + zlib.gzipSync(fs.readFileSync(path.join(dist, 'js', file))).length,
  0,
);
assert(gzipBytes < 470 * 1024, `Initial JavaScript exceeds 470 KiB gzip: ${gzipBytes}`);
const css = fs
  .readdirSync(path.join(dist, 'css'))
  .map((file) => fs.readFileSync(path.join(dist, 'css', file), 'utf8'))
  .join('\n');
assert(!css.includes('Font Awesome'), 'Full icon font stylesheet has returned');
console.log(
  `Bundle checks passed: no database runtime/full Lodash, initial JS ${(gzipBytes / 1024).toFixed(1)} KiB gzip.`,
);
