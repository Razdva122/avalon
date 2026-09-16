const fs = require('node:fs/promises');
const path = require('node:path');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const Beasties = require('beasties');
const { routesSeo } = require('../src/router/seo');
const { localizedPath } = require('../src/router/paths');

async function main() {
  const dist = path.resolve(__dirname, '../dist');
  const processor = new Beasties({
    path: dist,
    publicPath: '/',
    preload: 'media',
    noscriptFallback: true,
    // Shared assets are also used by client-side navigation, rooms and dialogs.
    pruneSource: false,
    // Vuetify replaces its theme stylesheet at runtime. Keep every theme intact.
    reduceInlineStyles: false,
    // Keep each block next to its full stylesheet, preserving cascade order.
    mergeStylesheets: false,
    inlineFonts: true,
    preloadFonts: false,
    logLevel: 'warn',
  });
  let maximum = 0;
  let count = 0;
  for (const route of Object.values(routesSeo).filter((route) => route.meta.prerender)) {
    for (const language of Object.keys(route.meta.multiLanguage)) {
      const pathname = localizedPath(route.path, language);
      const file = path.join(dist, pathname, 'index.html');
      const original = await fs.readFile(file, 'utf8');
      const processed = (await processor.process(original)).replace(
        /media="print" onload="this\.media='all'"/g,
        `media="print" data-critical-css="pending" onload="this.media='all';this.dataset.criticalCss='loaded'" onerror="this.media='all';this.dataset.criticalCss='error'"`,
      );
      // Beasties normalizes attributes while serializing. Publish only its head
      // changes so Vue's SSR body/teleports/comments remain byte-for-byte intact.
      const html = processed.slice(0, processed.indexOf('<body')) + original.slice(original.indexOf('<body'));
      const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1]).join('\n');
      const bytes = zlib.gzipSync(styles).length;
      assert(bytes < 8 * 1024, `${pathname}: inline styles exceed 8 KiB gzip (${bytes})`);
      maximum = Math.max(maximum, bytes);
      await fs.writeFile(file, html);
      count++;
    }
  }
  console.log(`Critical CSS: ${count} pages; largest inline CSS ${(maximum / 1024).toFixed(1)} KiB gzip.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
