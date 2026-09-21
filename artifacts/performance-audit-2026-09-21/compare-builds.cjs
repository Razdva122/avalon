const fs = require('fs'),
  path = require('path'),
  http = require('http'),
  zlib = require('zlib');
const puppeteer = require('puppeteer');
const root = path.resolve(__dirname, '../..');
if (!process.argv[2]) throw new Error('Usage: node compare-builds.cjs /path/to/baseline/dist');
(async () => {
  const output = [];
  for (const [variant, dist] of [
    ['before', path.resolve(process.argv[2])],
    ['after', root + '/packages/ui/dist'],
  ]) {
    const server = http
      .createServer((req, res) => {
        let file = path.join(dist, decodeURIComponent(new URL(req.url, 'http://local').pathname));
        try {
          if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
          let data = fs.readFileSync(file);
          const ext = path.extname(file);
          res.setHeader(
            'Content-Type',
            {
              '.html': 'text/html',
              '.js': 'application/javascript',
              '.css': 'text/css',
              '.webp': 'image/webp',
              '.woff2': 'font/woff2',
              '.png': 'image/png',
            }[ext] || 'application/octet-stream',
          );
          res.setHeader('Timing-Allow-Origin', '*');
          if (['.html', '.js', '.css'].includes(ext)) {
            data = zlib.gzipSync(data);
            res.setHeader('Content-Encoding', 'gzip');
          }
          res.setHeader('Content-Length', data.length);
          res.end(data);
        } catch {
          res.statusCode = 404;
          res.end();
        }
      })
      .listen(0, '127.0.0.1');
    await new Promise((r) => server.once('listening', r));
    const origin = 'http://127.0.0.1:' + server.address().port;
    const browser = await puppeteer.launch({ headless: true });
    for (const route of ['/', '/', '/', '/wiki/rules/', '/support/']) {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
      const c = await page.target().createCDPSession();
      await c.send('Network.enable');
      await c.send('Network.setCacheDisabled', { cacheDisabled: true });
      await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await c.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 150,
        downloadThroughput: 200000,
        uploadThroughput: 93750,
      });
      await page.setRequestInterception(true);
      page.on('request', (r) => {
        if (r.url().startsWith(origin)) r.continue();
        else if (r.url().startsWith('https://storage.yandexcloud.net/avalon-game/assets/img/'))
          r.continue({ url: origin + '/img/' + r.url().split('/').pop() });
        else r.abort();
      });
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'languages', { get: () => ['en'] });
        window.__audit = { lcp: 0, cls: [], mount: 0 };
        const t = setInterval(() => {
          if (document.querySelector('#app')?.__vue_app__) {
            window.__audit.mount = performance.now();
            clearInterval(t);
          }
        }, 20);
        new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__audit.lcp = e.startTime))).observe({
          type: 'largest-contentful-paint',
          buffered: true,
        });
        new PerformanceObserver((l) =>
          l
            .getEntries()
            .filter((e) => !e.hadRecentInput)
            .forEach((e) => window.__audit.cls.push({ t: e.startTime, v: e.value })),
        ).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(origin + route, { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction(() => window.__audit.mount > 0);
      await new Promise((r) => setTimeout(r, 500));
      const data = await page.evaluate(() => ({
        ...window.__audit,
        resources: performance
          .getEntriesByType('resource')
          .map((e) => ({ name: e.name, type: e.initiatorType, bytes: e.encodedBodySize }))
          .filter((e) => !e.name.includes('socket.io')),
      }));
      output.push({ variant, route, ...data });
      console.log(
        JSON.stringify({
          variant,
          route,
          mount: data.mount,
          lcp: data.lcp,
          bytes: data.resources.reduce((s, e) => s + e.bytes, 0),
        }),
      );
      fs.writeFileSync(path.join(__dirname, 'build-comparison.json'), JSON.stringify(output, null, 2));
      await page.close();
    }
    await browser.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
