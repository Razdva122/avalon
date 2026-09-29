const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { publicPage, targetCategory, createVitalsReporter } = require('../src/helpers/web-vitals-report.ts');

test('only known public pages are eligible; private paths and unknown slugs cannot become analytics dimensions', () => {
  assert.deepEqual(publicPage('/zh-tw/'), { path: '/zh-tw/', route: 'lobby', locale: 'zh-tw' });
  assert.deepEqual(publicPage('/wiki/roles/merlin/'), { path: '/wiki/roles/merlin/', route: 'role', locale: 'en' });
  for (const path of [
    '/room/secret/',
    '/ru/profile/',
    '/password-recovery/',
    '/stats/user/alice/',
    '/wiki/roles/alice@example.com/',
    '/unknown/',
  ]) {
    assert.equal(publicPage(path), null, path);
  }
});

function harness() {
  const events = [];
  let currentPath = '/zh-tw/';
  let restored = null;
  const report = createVitalsReporter({
    page: publicPage(currentPath),
    version: '66.6.1',
    viewport: 390,
    currentPath: () => currentPath,
    restoredContext: () => restored,
    send: (name, payload) => events.push({ name, payload }),
  });
  return {
    events,
    report,
    navigate: (path) => (currentPath = path),
    restore: () => (restored = { page: publicPage(currentPath), viewport: 1280 }),
  };
}
const lcp = () => ({
  name: 'LCP',
  id: 'v6-123',
  value: 3100,
  delta: 3100,
  rating: 'needs-improvement',
  navigationType: 'navigate',
  entries: [],
  attribution: {
    target: 'lobby-intro',
    timeToFirstByte: 1400,
    resourceLoadDelay: 0,
    resourceLoadDuration: 0,
    elementRenderDelay: 1700,
    url: 'https://example.com/alice?token=secret',
    navigationEntry: { name: 'https://example.com/?secret' },
    lcpEntry: { element: { outerHTML: 'private text' } },
  },
});

test('LCP sends only bounded dimensions and numeric attribution, with an explicit safe page URL', () => {
  const { report, events } = harness();
  report(lcp());
  const { name, payload } = events[0];
  assert.equal(name, 'web_vital');
  assert.equal(payload.metric_value, 3100);
  assert.equal(payload.ttfb_ms, 1400);
  assert.equal(payload.render_delay_ms, 1700);
  assert.equal(payload.metric_target, 'lobby-intro');
  assert.equal(payload.page_location, 'https://avalon-game.com/zh-tw/');
  assert.equal(payload.page_referrer, '');
  assert.equal(payload.page_title, '');
  assert.equal(payload.viewport, 'small');
  assert.ok(Object.keys(payload).length <= 25);
  assert.doesNotMatch(JSON.stringify(events), /secret|alice|outerHTML|private text/);
});

test('deduplicates identical reports but keeps updates and bfcache metric instances', () => {
  const { report, events } = harness();
  report(lcp());
  report(lcp());
  report({ ...lcp(), value: 3200, delta: 100 });
  report({ ...lcp(), id: 'v6-456' });
  assert.deepEqual(
    events.map(({ payload }) => payload.metric_sequence),
    [1, 2, 1],
  );
});

test('private navigation retains safe initial-load LCP but suppresses lifetime INP and CLS', () => {
  const { report, events, navigate } = harness();
  navigate('/room/secret/');
  report(lcp());
  assert.equal(events.length, 1);
  assert.equal(events[0].payload.page_location, 'https://avalon-game.com/zh-tw/');
  report({ ...lcp(), name: 'CLS' });
  report({ ...lcp(), name: 'INP' });
  assert.equal(events.length, 1);
  navigate('/wiki/rules/');
  report(lcp());
  assert.equal(events[0].payload.page_route, 'lobby');
  assert.equal(events[0].payload.spa_changed, 1);
});

test('bfcache reports use the page and viewport captured at restoration, not startup or a later SPA route', () => {
  const { report, events, navigate, restore } = harness();
  navigate('/wiki/rules/');
  restore();
  navigate('/about/');
  report({ ...lcp(), navigationType: 'back-forward-cache' });
  assert.equal(events[0].payload.page_route, 'rules');
  assert.equal(events[0].payload.page_location, 'https://avalon-game.com/wiki/rules/');
  assert.equal(events[0].payload.viewport, 'large');
  navigate('/room/secret/');
  restore();
  navigate('/');
  report({ ...lcp(), id: 'new', navigationType: 'back-forward-cache' });
  assert.equal(events.length, 1, 'restoring a private document cannot become a public page metric');
});

test('raw selectors never leave the reporter, including library fallback for removed DOM nodes', () => {
  const { report, events } = harness();
  report({ ...lcp(), attribution: { ...lcp().attribution, target: '#user-alice' } });
  assert.equal(events[0].payload.metric_target, 'other');
  assert.equal(targetCategory(null), 'other');
  assert.equal(targetCategory({ nodeType: 1, matches: (s) => s === '.lobby-intro', tagName: 'P' }), 'lobby-intro');
});

test('TTFB and INP attribution preserve timings without resource URLs or interaction contents', () => {
  const { report, events } = harness();
  report({
    ...lcp(),
    name: 'TTFB',
    attribution: {
      waitingDuration: 30,
      cacheDuration: 5,
      dnsDuration: 20,
      connectionDuration: 50,
      requestDuration: 1295,
    },
  });
  report({
    ...lcp(),
    name: 'INP',
    attribution: {
      interactionTarget: 'button',
      inputDelay: 50,
      processingDuration: 90,
      presentationDelay: 56,
      interactionType: 'pointer',
      processedEventEntries: [{ text: 'secret' }],
    },
  });
  assert.equal(events[0].payload.request_ms, 1295);
  assert.equal(events[1].payload.input_delay_ms, 50);
  assert.equal(events[1].payload.metric_target, 'button');
  assert.doesNotMatch(JSON.stringify(events), /secret/);
});

test('invalid measurements and analytics errors cannot break the application', () => {
  const { report, events } = harness();
  report({ ...lcp(), value: NaN });
  report({ ...lcp(), value: -1 });
  assert.equal(events.length, 0);
  const failing = createVitalsReporter({
    page: publicPage('/'),
    version: 'test',
    viewport: 1280,
    currentPath: () => '/',
    restoredContext: () => null,
    send: () => {
      throw Error('blocked');
    },
  });
  assert.doesNotThrow(() => failing(lcp()));
});
