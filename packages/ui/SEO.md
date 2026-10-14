# SEO changes and verification

[Documentation index](../../docs/README.md)

## URL policy

- English public pages use unprefixed URLs. `/en/...` redirects permanently to the matching English URL.
- Other languages use `/ru/`, `/zh-tw/`, `/zh-cn/`, `/es/`, and `/pt/`. A public URL determines its language, including after client-side navigation.
- Wiki links, breadcrumbs and their structured data retain the current language. The menu provides explicit language links for visitors without an account.
- Sitemap and hreflang list canonical public URLs only. Build dates are not presented as content modification dates.
- Old role aliases and `/wiki/addons/` have server and client redirects. Query parameters are preserved.
- Rooms, profiles, leaderboards and achievements have `noindex`; nginx supplies the header even before JavaScript runs. Crawling is allowed so search engines can read it.
- Unknown routes return HTTP 404. Only known dynamic routes receive the application shell. Keep the nginx dynamic-route allowlist in sync when adding routes.

## Multilingual acquisition guides

The three `/guides/` articles have complete English, Russian, Spanish, Portuguese, Simplified Chinese and Traditional Chinese content and metadata. Their English URLs are unprefixed; other versions use the existing locale prefixes. Every version is prerendered, hydrated, listed in the sitemap and has its own canonical plus six language alternates and English `x-default`. Localized lobby/wiki links expose the hub. Article actions, related links and breadcrumbs retain the current language. Language switching and translation suggestions lead to the same article, preserving query and fragment.

The bot action links to the current locale’s home with `#play-with-ai`, the existing lobby launch control. Human rooms and solo/friends-with-bots setup are described separately. Public AI copy refers to the settings' available sizes rather than freezing a temporary human-seat cap into the articles.

On a guide, an explicit choice of an unavailable language opens that language's home, preserving the query but clearing the old article fragment. The automatic language suggestion is hidden when the current page has no translation in the preferred language. Existing fully translated public pages still keep their same-page language links.

The implementation and measurements are recorded in [the dated acquisition report](../../docs/seo-acquisition-2026-10-14.md). Its candidate keywords and editorial prospects are research inputs, not measured demand or acquired links.

Article translations are independent lazy chunks in `src/pages/guides/locales`; the route loads the selected content before navigation completes. Small SEO metadata stays separate in `src/i18n/langs/pages/seo/guides` so article bodies never enter the initial bundle. Shared labels, image alternative text, source labels and descriptions are translated too. AI discussion-language availability remains a separate product constraint; translating a guide does not expand AI-supported languages.

## Language and migration behavior

Public pages do not redirect based on browser language or saved preferences. This makes their content stable for indexing and preserves an explicit English choice. An unprefixed legacy public link therefore opens English. Visitors with another preferred language receive a dismissible link to the same page in that language, with query and fragment preserved. The prompt is translated into the preferred language and excluded from prerendered HTML. Dismissal lasts for the tab session and does not change the visitor's preference.

Manual language choices are saved for guests as well as signed-in users. Merely opening a translated public link does not overwrite this choice. Private pages use the saved explicit choice, then the first supported browser language, then English. Invalid stored data is ignored; unavailable local storage leaves a new selection active in memory. Preference changes in another tab take effect on reload, rather than unexpectedly switching an ongoing game.

Rooms and other private routes have language-neutral URLs. Old language-prefixed private URLs redirect permanently to the neutral equivalent; room UUID casing and query parameters are retained. Copied room links also retain fragments. Changing language inside a room updates the interface without navigation or leaving the room. The language of a sender's public page does not force the recipient's game language.

| Entry or action                                  | Result                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| Russian browser opens `/wiki/roles/` from search | English page with a Russian translation suggestion                 |
| English browser opens `/ru/wiki/roles/`          | Russian page with an English translation suggestion                |
| Visitor explicitly chose English earlier         | Neutral room opens English even with a Russian browser             |
| New visitor opens `/ru/room/ID/`                 | Redirect to `/room/ID/`; browser language determines the interface |
| Visitor switches language inside a room          | Same room and URL; saved language and metadata update              |
| Visitor switches a public page's language        | Same article at its translated URL; preference is saved            |
| Visitor opens an unsupported URL                 | HTTP 404; no fabricated translation                                |

This policy follows [Google's multilingual site guidance](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites): separate language URLs and visible links instead of automatic language redirects. Search results may still show an older unprefixed URL while Google recrawls the site. Correct hreflang helps language targeting but does not guarantee which result Google selects.

## Rendering and performance

The three acquisition guides share one responsive article template across all six locales. Short introductions and a primary bot-play link precede the comparison; detailed access conditions appear after the explanations. Native contents disclosures link to stable section fragments with clearance for the fixed header. At widths up to 700px, labelled comparison cards replace the desktop table. Both layouts use the same rows, columns and source links; CSS hides the inactive layout. Prose has a narrower reading measure, while comparison tables can use the full article width. Routes, titles, canonical URLs and language alternates are unchanged by this layout revision.

The lobby and statistics heading render without waiting for a WebSocket acknowledgement. The lobby includes a localized introduction and links to rules and roles. The production prerenderer waits for rendering and hydration verification to finish, and build verification rejects missing content or incorrect metadata.

Chart.js theme registration is imported by the chart components rather than the application entry point. This keeps the chart library in an asynchronous chunk. This is not a measured claim about production LCP; repeat performance measurements after deployment and inspect the remaining large JavaScript/CSS bundles.

## Checks

`npm run build:ui` runs the UI tests, production build, and `check:build`. The bundle check prevents database runtimes and full Lodash from entering browser chunks and enforces an initial JavaScript size budget. The HTML checks cover every prerendered route for a heading, language, canonical, robots policy and alternate URLs, plus localized wiki links and breadcrumbs. It also checks sitemap completeness and uniqueness.

On a machine using an already installed browser, set `PUPPETEER_EXECUTABLE_PATH` to the Chrome executable if Puppeteer's downloaded browser is unavailable. The Docker build uses its bundled browser.

With nginx serving the resulting build on a local port, run:

```sh
SEO_BASE_URL=http://127.0.0.1:18080 node packages/ui/scripts/check-seo-http.cjs
```

This checks canonical pages, English and legacy redirects, query preservation, dynamic routes, `noindex` response headers and real 404 responses across all six languages. The production nginx configuration should also pass `nginx -t`.

## Deployment follow-up

Deploy the generated UI and updated nginx configuration together (the existing UI Dockerfile already packages both). No production deployment or Search Console submission is part of the local verification.

After deployment, rerun the HTTP checks, submit the corrected sitemap, and inspect the homepage, `/zh-tw/`, rules and an old redirected URL in Search Console. Compare clicks, impressions and CTR by page/query and monitor Core Web Vitals after new field data is collected. Content editing of the longer translated articles and detailed LCP profiling remain separate follow-up work.

Detailed Yandex findings, build-size comparisons, and LCP measurement limits are recorded in [the performance follow-up](PERFORMANCE-2026-09-16.md).

## Article hydration and lazy locales (60.1.0 follow-up)

Wiki/about pages are rendered with Vue's string renderer during the existing build, including fragment markers. On a direct visit `createSSRApp` attaches to this HTML instead of deleting and recreating the article. Other pages and private room shells retain normal client rendering. This is static generation; no Node rendering server or Docker Compose change is needed.

Every article is hydrated once in the build renderer, which asserts that its headings and paragraphs retain their DOM nodes. The original SSR HTML is then restored for publication. `data-ssr-path` ensures only the correct article is hydrated. Saved theme/profile settings are applied reactively after hydration, and the socket starts after mounting so listeners are ready. No socket is opened in prerendering.

`npm run serve` and `npm run build` generate six independent JSON dictionaries from the existing TypeScript translations via npm lifecycle scripts. Edit `src/i18n/langs`, never `src/i18n/generated` (ignored). If running type checks or webpack directly on a clean checkout, run `node packages/ui/scripts/generate-locales.cjs` first. The selected language and English fallback load before committing navigation. Short language-suggestion strings remain available independently. Failed dictionary requests can be retried; outdated selections cannot override a newer choice.

The HTML preloads only the selected locale and English fallback. Bundle checks reject reintroducing the all-language page dictionary into runtime chunks. Current startup JS including dictionaries is 287.1 KiB gzip for English, 324.0 KiB for Russian, and 317.2 KiB for Traditional Chinese (route-specific chunks excluded, as in the previous initial-bundle comparison). This is not a measured LCP result.
