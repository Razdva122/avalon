const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { routesSeo } = require('../src/router/seo');
const { basePath, localizedPath } = require('../src/router/paths');

// Regressions: strip only a leading locale, never substrings inside a route.
assert.equal(basePath('/en/wiki/roles/merlin/'), '/wiki/roles/merlin/');
assert.equal(basePath('/wiki/expansions/'), '/wiki/expansions/');
assert.equal(localizedPath('/ru/wiki/rules/', 'en'), '/wiki/rules/');
assert.equal(localizedPath('/wiki/rules', 'zh-TW'), '/zh-tw/wiki/rules/');
assert.equal(localizedPath('/en/', 'en'), '/');

const dist = path.resolve(__dirname, '../dist');
const origin = 'https://avalon-game.com';
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const expected = Object.values(routesSeo).flatMap((route) =>
  route.meta.skipSiteMap
    ? []
    : Object.keys(route.meta.multiLanguage).map((lang) => origin + localizedPath(route.path, lang)),
);
assert.deepEqual([...urls].sort(), [...expected].sort(), 'Sitemap must contain exactly the canonical public URLs');
assert.equal(new Set(urls).size, urls.length, 'Sitemap contains duplicates');

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
}

let checked = 0;
for (const route of Object.values(routesSeo).filter((route) => route.meta.prerender)) {
  for (const language of Object.keys(route.meta.multiLanguage)) {
    const pathname = localizedPath(route.path, language);
    const html = fs.readFileSync(path.join(dist, pathname, 'index.html'), 'utf8');
    assert.doesNotMatch(
      html,
      /<aside[^>]*class="language-suggestion"/,
      `${pathname}: personalized suggestion baked into HTML`,
    );
    assert.match(html, /<h1(?:\s|>)/, `${pathname}: missing prerendered heading`);
    if (/^\/(wiki(?:\/|$)|about(?:\/|$))/.test(basePath(pathname))) {
      assert(html.includes(`data-ssr-path="${pathname}"`), `${pathname}: missing hydration marker`);
      assert(html.includes('<!--[-->'), `${pathname}: missing Vue SSR fragment markers`);
    }

    assert.match(html, new RegExp(`<html[^>]*lang="${language}"`, 'i'), `${pathname}: wrong language`);
    const links = [...html.matchAll(/<link\s[^>]*>/g)].map(([tag]) => attributes(tag));
    const headWithJs = html.slice(0, html.indexOf('</head>')).replace(/<noscript>[\s\S]*?<\/noscript>/g, '');
    const stylesheets = [...headWithJs.matchAll(/<link\s[^>]*>/g)]
      .map(([tag]) => attributes(tag))
      .filter((link) => link.rel === 'stylesheet');
    assert(stylesheets.length, `${pathname}: missing full stylesheet fallback`);
    assert.match(headWithJs, /<style>[^<]+<\/style>/, `${pathname}: missing inline critical CSS`);
    for (const stylesheet of stylesheets) {
      assert.equal(stylesheet.media, 'print', `${pathname}: render-blocking stylesheet`);
      assert.equal(stylesheet['data-critical-css'], 'pending', `${pathname}: missing stylesheet readiness`);
      assert(stylesheet.onload && stylesheet.onerror, `${pathname}: missing stylesheet completion handlers`);
      assert(
        [...html.matchAll(/<noscript>([\s\S]*?)<\/noscript>/g)].some((match) => match[1].includes(stylesheet.href)),
        `${pathname}: missing no-JavaScript stylesheet fallback`,
      );
    }
    const localePreloads = links
      .filter((link) => link.rel === 'preload' && link.as === 'script' && /\/locale-/.test(link.href))
      .map((link) => link.href.match(/\/locale-(.+)\.[a-f0-9]+\.js$/)?.[1]);
    assert.deepEqual(
      localePreloads.sort(),
      [...new Set(['en', language.toLowerCase()])].sort(),
      `${pathname}: preload only selected locale and English fallback`,
    );

    assert.equal(
      links.find((link) => link.rel === 'canonical')?.href,
      origin + pathname,
      `${pathname}: wrong canonical`,
    );
    const robots = [...html.matchAll(/<meta\s[^>]*>/g)]
      .map(([tag]) => attributes(tag))
      .find((meta) => meta.name === 'robots');
    assert.equal(
      robots?.content,
      route.meta.skipSiteMap ? 'noindex, follow' : 'index, follow',
      `${pathname}: wrong robots policy`,
    );
    if (!route.meta.skipSiteMap) {
      for (const alternate of Object.keys(route.meta.multiLanguage)) {
        assert.equal(
          links.find((link) => link.hreflang === alternate)?.href,
          origin + localizedPath(route.path, alternate),
          `${pathname}: incorrect alternate ${alternate}`,
        );
      }
      assert.equal(links.find((link) => link.hreflang === 'x-default')?.href, origin + route.path);
    }
    if (route.name === 'lobby') {
      assert.match(html, /class="lobby-intro"/, `${pathname}: lobby is still waiting for the backend`);
    }
    if (route.path.startsWith('/wiki/')) {
      const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
      if (json?.trim()) {
        const breadcrumbs = JSON.parse(json);
        for (const item of breadcrumbs.itemListElement) {
          assert.equal(new URL(item.item).pathname, localizedPath(new URL(item.item).pathname, language));
        }
      }
      for (const [tag, href] of html.matchAll(/<a\s[^>]*href="([^"]*)"[^>]*>/g)) {
        if (tag.includes('hreflang=')) continue;
        if (href.startsWith('/') && basePath(href).startsWith('/wiki/')) {
          assert.equal(href, localizedPath(href, language), `${pathname}: link switches language: ${href}`);
        }
      }
    }
    checked++;
  }
}
console.log(`SEO checks passed: ${checked} prerendered pages and ${urls.length} sitemap URLs.`);
