const assert = require('node:assert/strict');
const { localizedPath } = require('../src/router/paths');

const origin = process.env.SEO_BASE_URL || 'http://127.0.0.1:18080';
const languages = ['en', 'ru', 'zh-tw', 'zh-cn', 'es', 'pt'];
const aliases = {
  '/wiki/addons/': '/wiki/expansions/',
  '/wiki/roles/isolde/': '/wiki/roles/lovers/',
  '/wiki/roles/tristan/': '/wiki/roles/lovers/',
  '/wiki/roles/wraith/': '/wiki/roles/oberon/',
  '/wiki/roles/good_lancelot/': '/wiki/roles/lancelots/',
  '/wiki/roles/evil_lancelot/': '/wiki/roles/lancelots/',
};

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
  console.log('HTTP SEO checks passed: all languages, aliases, private routes, query strings and 404 responses.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
