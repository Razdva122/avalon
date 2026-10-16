const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { routesSeo } = require('../src/router/seo');
const { basePath, localizedPath } = require('../src/router/paths');

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
      /<script\b[^>]*src="https:\/\/(?:www\.googletagmanager\.com|mc\.yandex\.ru)\//,
      `${pathname}: analytics loader baked into prerender and loaded twice`,
    );
    assert.doesNotMatch(
      html,
      /<aside[^>]*class="language-suggestion"/,
      `${pathname}: personalized suggestion baked into HTML`,
    );
    assert.match(html, /<h1(?:\s|>)/, `${pathname}: missing prerendered heading`);
    if (route.name === 'lobby' || route.name === 'wiki') {
      const discovery = html.match(/<section\b[^>]*class="game-guides"[^>]*>([\s\S]*?)<\/section>/)?.[1];
      assert(discovery, `${pathname}: missing visible game discovery section`);
      for (const guide of Object.values(routesSeo).filter((entry) => entry.path.startsWith('/guides/'))) {
        assert(
          discovery.includes(`href="${localizedPath(guide.path, language)}"`),
          `${pathname}: guide must be directly reachable without JavaScript: ${guide.path}`,
        );
      }
    }
    if (basePath(pathname) === '/' || /^\/(wiki|about|support|community|guides)(?:\/|$)/.test(basePath(pathname))) {
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
      assert.deepEqual(
        links
          .filter((link) => link.rel === 'alternate')
          .map((link) => link.hreflang)
          .sort(),
        [...Object.keys(route.meta.multiLanguage), 'x-default'].sort(),
        `${pathname}: alternate links must describe only available translations`,
      );
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
      const aiLaunch = html.match(/<div\b[^>]*id="play-with-ai"[^>]*>([\s\S]*?)<\/div>/)?.[1];
      assert(aiLaunch?.includes('bot-room-button'), `${pathname}: AI fragment must target the existing launch control`);
      const main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0] || '';
      for (const target of ['/about/', '/stats/', '/wiki/']) {
        assert(
          main.includes(`href="${localizedPath(target, language)}"`),
          `${pathname}: missing visible ${target} link`,
        );
      }
      assert(
        main.includes(`href="${localizedPath('/guides/social-deduction-games-online/', language)}"`),
        `${pathname}: missing guide entry`,
      );
    }
    if (route.path === '/wiki/') {
      assert(
        html.includes(`href="${localizedPath('/guides/social-deduction-games-online/', language)}"`),
        `${pathname}: missing guide entry`,
      );
    }
    if (route.path.startsWith('/guides/')) {
      assert(
        html.includes(`href="${localizedPath('/', language)}#play-with-ai"`),
        `${pathname}: missing real AI learning CTA`,
      );
      const crumbs = JSON.parse(
        html.match(/<script id="breadcrumb-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ||
          'null',
      );
      assert(crumbs, `${pathname}: missing guide breadcrumbs`);
      assert.deepEqual(
        crumbs.itemListElement.map((item) => ({ to: new URL(item.item).pathname, title: item.name })),
        route.meta.multiLanguage[language].breadcrumbs,
        `${pathname}: guide breadcrumbs must match public metadata`,
      );
      assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${pathname}: expected one article heading`);
      assert.match(html, new RegExp(`<article[^>]*lang="${language}"`), `${pathname}: article language`);
      for (const href of [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((m) => m[1])) {
        if (href.startsWith('/') && !href.startsWith('//')) {
          const url = new URL(href, origin);
          assert.equal(
            url.pathname,
            localizedPath(url.pathname, language),
            `${pathname}: link switches locale: ${href}`,
          );
        }
      }
    }
    if (route.path.startsWith('/wiki/')) {
      const json = html.match(
        /<script id="breadcrumb-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/,
      )?.[1];
      if (route.path !== '/wiki/') assert(json?.trim(), `${pathname}: missing breadcrumb structured data`);
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
