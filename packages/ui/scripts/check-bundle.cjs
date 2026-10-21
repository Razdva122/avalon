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
// Diagnostics are fetched independently, but still count their cost explicitly.
const vitals = files.filter((file) => /^web-vitals\..*\.js$/.test(file));
assert.equal(vitals.length, 1, 'Expected one independently loaded Web Vitals chunk');
const vitalsBytes = zlib.gzipSync(fs.readFileSync(path.join(dist, 'js', vitals[0]))).length;
assert(vitalsBytes < 15.75 * 1024, `Web Vitals diagnostics exceed 15.75 KiB gzip: ${vitalsBytes}`);
console.log(`Optional Web Vitals diagnostics: ${(vitalsBytes / 1024).toFixed(1)} KiB gzip.`);
const gzipBytes = initial.reduce(
  (sum, file) => sum + zlib.gzipSync(fs.readFileSync(path.join(dist, 'js', file))).length,
  0,
);
// Measured after the wiki split: app/vendors 264.1 KiB, common dictionaries
// 26.8–34.6 KiB, ordinary entries ≤341.9 KiB and chart entries ≤457.3 KiB.
// Keep a small allowance for edits and compression differences across Node versions.
assert(gzipBytes < 270 * 1024, `Initial JavaScript exceeds 270 KiB gzip: ${gzipBytes}`);
const localeBudgets = { en: 29, ru: 37, es: 31, pt: 31, 'zh-cn': 32, 'zh-tw': 32, vi: 32 };
const localeSizes = Object.fromEntries(
  Object.entries(localeBudgets).map(([language, budget]) => {
    const chunks = files.filter((file) => file.startsWith(`locale-${language}.`) && file.endsWith('.js'));
    assert.equal(chunks.length, 1, `${language}: expected one independent locale chunk`);
    const wikiChunks = files.filter((file) => file.startsWith(`wiki-locale-${language}.`) && file.endsWith('.js'));
    assert.equal(wikiChunks.length, 1, `${language}: expected one deferred wiki dictionary`);
    const bytes = zlib.gzipSync(fs.readFileSync(path.join(dist, 'js', chunks[0]))).length;
    assert(bytes < budget * 1024, `${language}: common dictionary ${bytes} exceeds ${budget} KiB gzip`);
    return [language, bytes];
  }),
);
for (const [language, bytes] of Object.entries(localeSizes)) {
  const startup = gzipBytes + localeSizes.en + (language === 'en' ? 0 : bytes);
  assert(startup < 332 * 1024, `${language}: startup plus dictionaries exceeds 332 KiB gzip`);
}
const css = fs
  .readdirSync(path.join(dist, 'css'))
  .map((file) => fs.readFileSync(path.join(dist, 'css', file), 'utf8'))
  .join('\n');
assert(!css.includes('Font Awesome'), 'Full icon font stylesheet has returned');
console.log(
  `Bundle checks passed: no database runtime/full Lodash, initial JS ${(gzipBytes / 1024).toFixed(1)} KiB gzip; with English ${((gzipBytes + localeSizes.en) / 1024).toFixed(1)} KiB.`,
);

// Count the complete prerendered entry, not only app/vendors: route chunks and
// both locale dictionaries are part of the visitor's real startup download.
const compressed = new Map();
function gzipSize(url) {
  if (!compressed.has(url)) compressed.set(url, zlib.gzipSync(fs.readFileSync(path.join(dist, url))).length);
  return compressed.get(url);
}
function htmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : file.endsWith('.html') ? [file] : [];
  });
}
const buildOnly = new Set(
  maps
    .filter((file) => {
      const { sources } = JSON.parse(fs.readFileSync(path.join(dist, 'js', file), 'utf8'));
      return sources.some((source) => /@vue\/server-renderer|helpers\/prerender-page/.test(source));
    })
    .map((file) => `/js/${file.slice(0, -4)}`),
);
let maximum = 0;
let largestWiki = { bytes: 0, page: '' };
for (const file of htmlFiles(dist)) {
  const html = fs.readFileSync(file, 'utf8');
  const urls = [
    ...new Set([...html.matchAll(/(?:src|href)="(\/(?:js|css)\/[^" ]+\.(?:js|css))"/g)].map((match) => match[1])),
  ];
  const js = urls.filter((url) => url.endsWith('.js'));
  for (const url of js) assert(!buildOnly.has(url), `${file}: build-only renderer preloaded: ${url}`);
  const jsBytes = js.reduce((sum, url) => sum + gzipSize(url), 0);
  const cssBytes = urls.filter((url) => url.endsWith('.css')).reduce((sum, url) => sum + gzipSize(url), 0);
  const segments = path.relative(dist, file).split(path.sep);
  const charts = segments.includes('stats');
  const trapperPage = segments.includes('wiki') && segments.includes('trapper');
  const trapperLocales = js.filter((url) => /\/trapper-locale-/.test(url));
  assert.equal(trapperLocales.length > 0, trapperPage, `${file}: Trapper dictionaries must load only on its own page`);
  if (segments.includes('wiki') && jsBytes > largestWiki.bytes) {
    largestWiki = { bytes: jsBytes, page: path.relative(dist, file) };
  }
  const jsBudget = charts ? 466 : segments.includes('wiki') ? 383.25 : 350;
  assert(
    jsBytes < jsBudget * 1024,
    `${file}: route startup JS ${jsBytes} exceeds ${jsBudget} KiB gzip; chunks: ${js.map((url) => `${path.basename(url)}=${gzipSize(url)}`).join(', ')}`,
  );
  // The complete classic role set adds full-artwork and thumbnail image rules.
  assert(cssBytes < (charts ? 56 : 51) * 1024, `${file}: route CSS ${cssBytes} exceeds budget`);
  maximum = Math.max(maximum, jsBytes);
}
const fonts = fs.readdirSync(path.join(dist, 'fonts')).filter((file) => file.endsWith('.woff2'));
const fontBytes = fonts.reduce((sum, file) => sum + fs.statSync(path.join(dist, 'fonts', file)).size, 0);
assert(fontBytes < 25 * 1024, `Initial icon fonts exceed 25 KiB: ${fontBytes}`);
console.log(
  `Route budgets passed: JS <350 KiB (wiki <383.25, charts <466), CSS ≤51 KiB (charts ≤56); font ${(fontBytes / 1024).toFixed(1)} KiB.`,
);

console.log(
  `Largest wiki entry: ${(largestWiki.bytes / 1024).toFixed(2)} KiB gzip (${largestWiki.page}); headroom ${383.25 * 1024 - largestWiki.bytes} bytes.`,
);
