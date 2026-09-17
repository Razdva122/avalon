// Check the release artifact, including CSS backgrounds and crawler-facing images.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { imageGenerator } = require('../image-storage.cjs');
const publicBase = imageGenerator({ ...process.env, NODE_ENV: 'production' }).publicPath;
const dist = path.resolve(__dirname, '../dist');
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const name = path.join(dir, entry.name);
    return entry.isDirectory() ? files(name) : [name];
  });
}
const built = files(dist);
const digest = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const images = built.filter((file) => /\.(png|webp)$/.test(file));
const emitted = new Set(images.map(digest));
const sources = files(path.resolve(__dirname, '../src/assets')).filter((file) => /\.(png|webp)$/.test(file));
for (const file of sources) assert(emitted.has(digest(file)), `Image missing from release: ${file}`);
let references = 0;
for (const file of built.filter((file) => /\.(html|css|js)$/.test(file))) {
  const text = fs.readFileSync(file, 'utf8');
  assert(
    !/storage\.yandexcloud\.net\/avalon-game\/(?:images|icons)\//.test(text),
    `Unversioned cloud image in ${file}`,
  );
  if (file.endsWith('.js')) continue;
  const urls = file.endsWith('.css')
    ? [...text.matchAll(/url\(["']?([^\s)"']+)["']?\)/g)].map((match) => match[1])
    : [...text.matchAll(/<meta\b[^>]*property="og:(?:image|logo)"[^>]*content="([^"]+)"/g)].map((match) => match[1]);
  for (const url of urls) {
    if (!/\.(png|webp)(?:$|\?)/.test(url)) continue;
    const parsed = new URL(url, 'https://avalon-game.com' + '/' + path.relative(dist, file));
    const base = new URL(publicBase, 'https://avalon-game.com').href;
    assert(parsed.href.startsWith(base), `Wrong image host or prefix: ${url}`);
    const emittedPath = decodeURIComponent(parsed.href.slice(base.length));
    assert(/^img\/[^/]+\.[a-f0-9]{16}\.(png|webp)$/.test(emittedPath), `Unversioned image: ${url}`);
    assert(fs.existsSync(path.join(dist, emittedPath)), `Broken image in ${file}: ${url}`);
    references++;
  }
}
assert(references > 0, 'No image references checked');
console.log(`Image checks passed: ${sources.length} source assets emitted, ${references} CSS/SEO references resolved.`);

const releaseFiles = fs
  .readdirSync(path.join(dist, 'img'))
  .sort()
  .map((name) => {
    assert(/^[a-zA-Z0-9_-]+\.[a-f0-9]{16}\.(png|webp)$/.test(name), `Unexpected image artifact: ${name}`);
    const file = path.join(dist, 'img', name);
    return { name, size: fs.statSync(file).size, sha256: digest(file) };
  });
fs.writeFileSync(
  path.join(dist, 'image-release.json'),
  JSON.stringify({ publicBase, files: releaseFiles }, null, 2) + '\n',
);
