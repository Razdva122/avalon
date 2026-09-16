# SEO and performance follow-up — 16 September 2026

## Yandex Webmaster findings

The authenticated property is https://avalon-game.com. The inspected reports still predominantly describe crawls before release 60.0.1; their warnings are not proof of a current regression.

- Duplicate titles and descriptions: 71 pages (37%). Examples include English/unprefixed URLs previously rendered in Russian alongside `/ru/` equivalents, and 11 user-achievement pages with a common title. Stable public URL languages and private `noindex` in 60.0.1 address those causes after recrawling.
- The outstanding diagnostics recommendation is incorrect 404 handling, last checked 11 March 2024. Production HTTP checks now pass. Requested recheck on 16 September; Webmaster confirms “Проверяем сайт”.
- Sitemap was last downloaded at 05:34 on 16 September and still lists 203 URLs. Production now has 174 canonical public URLs. Requested a sitemap recrawl; daily remaining requests changed from 10 to 9.
- External sharing URLs contain `f_link_type`, `flow_extra`, `hybrid_event_param`, `spm`, and webview parameters. Some are already marked noncanonical; others remain under processing. Added an explicit Yandex `Clean-param` directive for observed parameters unused by the application. Parameters are not removed from visitor URLs and crawling is not blocked.
- Old `/wiki/addons/excalibur/` and `/zh-cn/wiki/addons/lady/` URLs appear in the report. Added redirects for the four known expansion names in every supported locale. Unknown addon names remain 404.
- Query report period: 14 August–14 September 2026, all devices. Examples: “авалон игра” 194 impressions / 5 clicks / 2.57% CTR; “the resistance: avalon” 116 / 8 / 6.89%; “авалон игра правила” 18 / 4 / 22.22%; “авалон правила” 10 / 4 / 40%. Small samples should not be treated as stable conversion evidence. The dashboard's “Invalid date”/zero headline is not a reliable basis for claiming a traffic collapse.

Reports: [duplicates](https://webmaster.yandex.ru/site/https:avalon-game.com:443/indexing/double-descriptions/), [diagnostics](https://webmaster.yandex.ru/site/https:avalon-game.com:443/optimization/checklist/), [sitemap](https://webmaster.yandex.ru/site/https:avalon-game.com:443/indexing/sitemap/), [query statistics](https://webmaster.yandex.ru/site/https:avalon-game.com:443/efficiency/statistics/).

## Baseline LCP and limitations

[PageSpeed report for the rules page](https://pagespeed.web.dev/analysis/https-avalon-game-com-wiki-rules/ise6yvbh14?form_factor=mobile) displayed **origin-level mobile field data**: LCP 3.3 s, INP 179 ms, CLS 0, FCP 1.9 s, TTFB 1.2 s. Desktop origin data: LCP 3.4 s, INP 74 ms, CLS 0.03, FCP 1.8 s, TTFB 1.1 s. These are rolling 28-day values, not measurements of this change or exclusively of the rules page. The URL-level tab was unavailable.

The lab section did not complete during the audit; the public PageSpeed API returned HTTP 429 quota exceeded. No before/after Lighthouse score or LCP improvement is claimed. Retest after deployment; field data will take time to reflect the change. [Google's LCP guidance](https://web.dev/articles/optimize-lcp) explains the distinction between lab and field data and the load/render delay components.

## Implemented changes

- Replaced runtime imports from the shared model barrel with imports from browser-safe constant modules. The barrel executed database model decorators and pulled Typegoose/Mongoose into the initial client bundle. Moved the achievement enum to a dependency-free module and re-exported it at the old path to preserve backend compatibility.
- Replaced the full Lodash import with `lodash/shuffle`; other function imports remain unchanged.
- Replaced Font Awesome's complete stylesheet/font families with the six original SVG paths used by the application, preserving the existing Vuetify icon names and the icons' license attribution.
- Wait for the initial public route before mounting Vue so the prerendered article stays visible while its chunk loads. Private routes mount immediately because their server shell contains the lobby rather than private content.
- Disabled third-party requests only during prerendering: remote analytics/images are unnecessary for static text and metadata and can stall the build. Visitor-side analytics and images are unchanged.
- Added a preconnect for the existing image storage origin. No speculative image preloads or blanket eager loading.
- Cache content-hashed JS/CSS/font files for one year with `immutable`; ordinary HTML remains revalidatable using `no-cache`. Missing assets still return 404.
- Updated caniuse-lite from 1.0.30001692 to 1.0.30001810 through the official updater. It reported no browser target changes.
- Added build assertions excluding database runtimes/full Lodash and limiting initial JavaScript to 470 KiB gzip. Source maps are used for the dependency audit. SEO validation remains enabled.

The final verified optimized build reduced initial JS from about **721 to 424.3 KiB gzip (41%)**, and initial CSS from about **93 to 66 KiB gzip (29%)**, using the Vue CLI build table's gzip figures. These are compressed asset sizes, not page transfer totals or measured LCP improvements.

## Build warnings

| Message                                                      | Finding / action                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Babel deoptimized styling for `mongoose/dist/browser.umd.js` | Removed the database runtime from all browser chunks; checked source maps.                                                                                                                                                                                                   |
| Babel deoptimized styling for `lodash/lodash.js`             | Replaced the barrel import with a function import.                                                                                                                                                                                                                           |
| caniuse-lite is 21 months old                                | Updated the browser database in the lockfile.                                                                                                                                                                                                                                |
| CSS conflicting order (six warnings)                         | Present in both baseline and final builds, involving Vuetify list/select/selection-control styles. The rules-page role configuration and header render correctly in the browser smoke check; exhaustive component coverage remains outstanding. Warnings are not suppressed. |
| Asset/entrypoint size recommendations                        | Reduced substantially; two warnings remain because the initial app still includes six locales and Vuetify. Do not hide the warning or claim the remaining cost is resolved.                                                                                                  |
| Node 20 action deprecation                                   | GitHub reports Docker actions being run under Node 24. Build infrastructure follow-up; not a visitor LCP issue.                                                                                                                                                              |
| Relative backend WORKDIR                                     | Existing Dockerfile warning; does not cause the UI prerender failure.                                                                                                                                                                                                        |
| Local Node 23 versus node-ipc supported engines              | Existing local tooling compatibility warning; use a supported project runtime for reproducibility.                                                                                                                                                                           |

## Verification and next measurements

Production build, 180 prerendered pages / 174 sitemap URLs, language-policy tests, all 94 backend tests, bundle checks, nginx syntax validation, and local HTTP checks including immutable headers and missing assets. Browser visual checks cover article rendering, the role configuration dialog, and SVG header icons; no live game was modified.

Deploy UI and nginx together. Rerun the HTTP checks against production; compare cold mobile LCP on `/`, `/wiki/rules/`, and `/zh-tw/`, then check origin/URL field data separately. Revisit duplicate metadata and sitemap counts after Yandex finishes recrawling.

Further work should be driven by an actual performance trace: investigate the field TTFB of 1.2 s, compare geographic latency, and consider splitting locale dictionaries (with explicit async-language UX tests) if JS execution remains a bottleneck. Russian homepage snippet improvements can be measured separately against the query baseline above.

## Follow-up after the 60.1.0 deployment

The [production Lighthouse run](https://pagespeed.web.dev/analysis/https-avalon-game-com-wiki-rules/a05qppvy5m?form_factor=mobile), captured 16 September 2026 at 16:09 GMT+5 for `/wiki/rules/`, finally completed: mobile slow-4G LCP 11.8 s, FCP 3.4 s, TBT 630 ms, CLS 0, performance 46; desktop LCP 1.0 s, FCP 0.8 s, TBT 220 ms, CLS 0, performance 90. Origin field LCP still reads 3.3/3.4 s. There was no completed pre-60.1.0 lab run, so this does not establish a regression or a quantified improvement.

The LCP element was the introductory paragraph. Code inspection confirmed that `createApp().mount()` clears its container, even when mounting waits for the route. The follow-up branch replaces this with build-time SSR markup and client hydration for wiki/about pages. Browser tests exposed invalid block-level icon elements inside paragraphs; switching their roots to spans while retaining block styling fixes HTML parser repairs and hydration mismatches.

The follow-up also generates independent language dictionaries at build time. Merely moving the old imports behind dynamic imports was insufficient: the shared page translation module still grouped all six languages into a 137 KiB gzip chunk. Generation preserves the source translations while eliminating this shared runtime payload. Startup plus English is now 287.1 KiB gzip versus 424.3 KiB previously (~32% less); Russian plus English is 324.0 KiB (~24% less). Base app/vendor JS alone is 259.0 KiB. These totals exclude route-specific chunks and are not complete page transfer sizes.

Verification: production build, all 180 prerendered pages / 174 sitemap URLs, hydration node-retention checks for wiki/about pages, 14 language-policy/loading tests, bundle budgets and local nginx HTTP checks. Browser smoke tests cover English/Russian/Traditional Chinese article loading, client-side language navigation, saved dark theme after reload, role configuration, stable-English homepage with a Russian suggestion, neutral room language choice and persistence, and mobile layout at 390 px. No hydration warnings on the checked final pages. A real multiplayer session was not exercised against the local static server.

Remaining: publish the new UI image, then perform three mobile Lighthouse runs per page on `/`, `/wiki/rules/`, and `/zh-tw/` and compare medians under identical settings. Keep lab and 28-day field data separate. Initial CSS and heavy role images remain candidates if the new trace still shows blocking; do not infer sub-2.5 s LCP from reduced JavaScript or passing hydration tests. The existing eight build warnings (CSS order and asset/entrypoint size) remain.

One final build attempt timed out waiting for `/zh-tw/stats/`; the preceding and subsequent full builds passed. Added page-state and browser-error diagnostics to prerender failures. The intermittent timeout's cause was not reproduced or established, so build flakiness should still be watched in CI.
