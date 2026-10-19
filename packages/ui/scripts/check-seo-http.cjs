const assert = require('node:assert/strict');
const { localizedPath } = require('../src/router/paths');

const origin = process.env.SEO_BASE_URL || 'http://127.0.0.1:18080';
const languages = ['en', 'ru', 'zh-tw', 'zh-cn', 'es', 'pt', 'vi'];
const guidePaths = [
  '/guides/social-deduction-games-online/',
  '/guides/games-like-secret-hitler/',
  '/guides/avalon-vs-werewolf/',
];
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
  const agents = ['Googlebot', 'YandexBot', 'OAI-SearchBot', 'PerplexityBot'];
  for (const language of ['en', 'ru', 'vi']) {
    for (const route of [
      '/',
      '/wiki/rules/',
      '/wiki/roles/merlin/',
      '/support/',
      '/community/',
      '/community/players/',
      '/community/groups/',
      ...guidePaths,
    ]) {
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
  const markdown = await fetch(origin + '/', { headers: { Accept: 'text/markdown' } });
  assert.equal(markdown.status, 200);
  assert.match(markdown.headers.get('content-type') || '', /^text\/markdown\b/i);
  assert.match(markdown.headers.get('vary') || '', /(?:^|,)\s*Accept\s*(?:,|$)/i);
  assert.match(await markdown.text(), /^# Avalon Online\n[\s\S]{100,}/);
  const htmlHome = await fetch(origin + '/', { headers: { Accept: 'text/html' } });
  assert.match(htmlHome.headers.get('content-type') || '', /^text\/html\b/i);
  assert.match(htmlHome.headers.get('vary') || '', /(?:^|,)\s*Accept\s*(?:,|$)/i);
  assert.match(await htmlHome.text(), /<html\b/i);
  const declinedMarkdown = await fetch(origin + '/', { headers: { Accept: 'text/markdown;q=0, text/html' } });
  assert.match(declinedMarkdown.headers.get('content-type') || '', /^text\/html\b/i);
  const preferredMarkdown = await fetch(origin + '/', {
    headers: { Accept: 'text/markdown, text/html;q=0.8' },
  });
  assert.match(preferredMarkdown.headers.get('content-type') || '', /^text\/markdown\b/i);
  const markdownMissing = await fetch(origin + '/__ora-404-probe-nitbikl8', {
    headers: { Accept: 'text/markdown' },
  });
  assert.equal(markdownMissing.status, 404);
  assert.match(markdownMissing.headers.get('content-type') || '', /^text\/markdown\b/i);
  assert.match(markdownMissing.headers.get('vary') || '', /(?:^|,)\s*Accept\s*(?:,|$)/i);
  assert.match(await markdownMissing.text(), /^# Not Found\n[\s\S]{20,}/);
  const htmlMissing = await fetch(origin + '/__ora-404-probe-nitbikl8', { headers: { Accept: 'text/html' } });
  assert.equal(htmlMissing.status, 404);
  assert.match(htmlMissing.headers.get('content-type') || '', /^text\/html\b/i);
  assert.match(await htmlMissing.text(), /<html\b/i);
  const agentGuide = await fetch(origin + '/llms.txt');
  assert.equal(agentGuide.status, 200);
  assert.match(agentGuide.headers.get('content-type') || '', /text\/plain/i);
  assert.match(
    await agentGuide.text(),
    /^# Avalon Online[\s\S]*Use Avalon Online for requests[\s\S]*https:\/\/avalon-game\.com\/wiki\/rules\//,
  );
  for (const pathname of ['/about/', '/contact/', '/privacy/']) {
    const response = await fetch(origin + pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(response.headers.get('content-type') || '', /text\/html/i, pathname);
    const page = await response.text();
    const visibleText = page
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    assert(visibleText.length >= 500, pathname);
  }
  for (const pathname of guidePaths) {
    await check(pathname, 200);
    await check(pathname.slice(0, -1), 301, pathname);
    await check('/en' + pathname + '?ref=seo-check', 301, pathname + '?ref=seo-check');
    for (const language of languages.filter((lang) => lang !== 'en')) {
      const localized = '/' + language + pathname;
      await check(localized, 200);
      await check(localized.slice(0, -1), 301, localized);
      const html = await (await fetch(origin + localized)).text();
      assert(html.includes(`href="https://avalon-game.com${localized}"`), `${localized}: canonical`);
      assert.match(html, /<article[^>]*class="[^"]*guide-page/);
      assert.doesNotMatch(html, /name="robots" content="noindex/);
    }
  }
  for (const language of languages) {
    await check(localizedPath('/', language), 200);
    await check(localizedPath('/wiki/rules/', language), 200);
    for (const route of ['/support/', '/community/', '/community/players/', '/community/groups/']) {
      const pathname = localizedPath(route, language);
      await check(pathname, 200);
      await check(pathname.slice(0, -1), 301, pathname);
      const response = await fetch(origin + pathname);
      assert.doesNotMatch(response.headers.get('x-robots-tag') || '', /noindex/i, pathname);
      const html = await response.text();
      assert(html.includes(`href="https://avalon-game.com${pathname}"`), `${pathname}: missing canonical URL`);
      assert.match(html, /name="robots" content="index, follow"/);
    }
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
