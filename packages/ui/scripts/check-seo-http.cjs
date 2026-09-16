const assert = require('node:assert/strict');
const { localizedPath } = require('../src/router/paths');

const origin = process.env.SEO_BASE_URL || 'http://127.0.0.1:18080';
const languages = ['en', 'ru', 'zh-tw', 'zh-cn', 'es', 'pt'];
const aliases = {
  '/wiki/addons/lady/': '/wiki/expansions/lady/',
  '/wiki/addons/lady_sea/': '/wiki/expansions/lady_sea/',
  '/wiki/addons/excalibur/': '/wiki/expansions/excalibur/',
  '/wiki/addons/plot_cards/': '/wiki/expansions/plot_cards/',
  '/wiki/addons/': '/wiki/expansions/',
  '/wiki/roles/isolde/': '/wiki/roles/lovers/',
  '/wiki/roles/tristan/': '/wiki/roles/lovers/',
  '/wiki/roles/wraith/': '/wiki/roles/oberon/',
  '/wiki/roles/good_lancelot/': '/wiki/roles/lancelots/',
  '/wiki/roles/evil_lancelot/': '/wiki/roles/lancelots/',
};

async function checkCrawlerContent() {
  // User-Agent probes detect simple bot blocking, not verified crawler IP policies.
  const agents = ['Googlebot', 'OAI-SearchBot', 'PerplexityBot'];
  for (const language of ['en', 'ru']) {
    for (const route of ['/', '/wiki/rules/', '/wiki/roles/merlin/']) {
      const pathname = localizedPath(route, language);
      for (const agent of agents) {
        const response = await fetch(origin + pathname, { headers: { 'User-Agent': agent }, redirect: 'manual' });
        const label = `${agent} ${pathname}`;
        assert.equal(response.status, 200, `${label}: crawler must receive the page directly`);
        assert.match(response.headers.get('content-type') || '', /text\/html/, label);
        assert.doesNotMatch(response.headers.get('x-robots-tag') || '', /noindex|nosnippet|none/i, label);
        const html = await response.text();
        assert.match(html, /<h1\b[^>]*>[^]*?<\/h1>/, `${label}: missing heading without JavaScript`);
        const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)]
          .map((match) => match[1].replace(/<[^>]+>/g, '').trim())
          .join(' ');
        assert(paragraphs.length > 80, `${label}: missing readable content without JavaScript`);
      }
    }
  }
}

async function check(path, status, redirect, noindex = false) {
  const response = await fetch(origin + path, { redirect: 'manual' });
  assert.equal(response.status, status, `${path}: HTTP status`);
  if (redirect) {
    const location = new URL(response.headers.get('location'), origin);
    assert.equal(location.pathname + location.search, redirect, `${path}: redirect destination`);
  }
  if (noindex) assert.match(response.headers.get('x-robots-tag') || '', /noindex/, `${path}: missing noindex header`);
  await response.arrayBuffer();
}

async function main() {
  for (const language of languages) {
    await check(localizedPath('/', language), 200);
    await check(localizedPath('/wiki/rules/', language), 200);
    await check(localizedPath('/404/', language), 404, null, true);
    await check(localizedPath('/seo-check-does-not-exist/', language), 404, null, true);
    for (const path of [
      '/room/seo-check/',
      '/profile/',
      '/leaderboard/',
      '/stats/user/seo-check/',
      '/achievements/user/seo-check/',
      '/achievements/global/',
    ]) {
      if (language === 'en') await check(path, 200, null, true);
      else await check(localizedPath(path, language) + '?ref=seo-check', 301, path + '?ref=seo-check');
    }
    for (const [path, target] of Object.entries(aliases)) {
      await check(
        localizedPath(path, language) + '?ref=seo-check',
        301,
        localizedPath(target, language) + '?ref=seo-check',
      );
    }
  }
  await check('/en/room/seo-check/?ref=seo-check', 301, '/room/seo-check/?ref=seo-check');
  await check('/en/', 301, '/');
  await check('/en/wiki/rules/?ref=seo-check', 301, '/wiki/rules/?ref=seo-check');
  await check('/wiki/rules', 301, '/wiki/rules/');
  await check('/Order.htm', 404, null, true);
  await check('/robots.txt', 200);
  await check('/sitemap.xml', 200);
  const home = await fetch(origin + '/');
  assert.match(home.headers.get('cache-control') || '', /no-cache/, 'HTML must revalidate after releases');
  const html = await home.text();
  const assets = [...html.matchAll(/(?:src|href)="(\/(?:js|css)\/[^"]+\.(?:js|css))"/g)].map((match) => match[1]);
  assert(assets.length > 0, 'No initial assets found');
  for (const asset of new Set(assets)) {
    const response = await fetch(origin + asset);
    assert.equal(response.status, 200, asset);
    assert.match(response.headers.get('cache-control') || '', /max-age=31536000, immutable/, asset);
    await response.arrayBuffer();
  }
  await check('/js/missing.12345678.js', 404, null, true);
  await checkCrawlerContent();
  console.log(
    'HTTP SEO checks passed: all languages, aliases, private routes, query strings, 404 responses and crawler HTML.',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
