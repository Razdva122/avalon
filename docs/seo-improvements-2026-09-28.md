# SEO improvements — 28 September 2026

> Historical record: findings, measurements and plans describe their recorded date. For current setup and operations, use the [documentation index](README.md).

## Basis and scope

The owner approved implementation following a live review of Google Search Console and Yandex Webmaster. This is a bounded update to existing pages, translations and navigation; canonical URLs and game mechanics remain unchanged.

Google Web Search, 29 August–25 September 2026: 3,866 clicks, 90,615 impressions, 4.3% displayed CTR, average position 7.4. Query metrics were read from the authenticated UI, not inferred from public search results. Yandex popular-query CSV, 26 August–26 September: 593 query rows, summing to 56 clicks and 1,343 impressions. The latter is the exported query set, not a verified property total. Periods differ; these numbers do not establish a traffic trend.

| Google query            | Clicks | Impressions |   CTR | Position |
| ----------------------- | -----: | ----------: | ----: | -------: |
| avalon online           |    181 |       1,747 | 10.4% |      4.8 |
| play avalon online      |     13 |         247 |  5.3% |      5.9 |
| avalon game online      |     35 |         224 | 15.6% |      7.7 |
| how to play avalon      |      3 |         385 |  0.8% |      7.4 |
| avalon board game rules |     24 |         226 | 10.6% |      9.0 |
| 阿瓦隆 規則             |      8 |         421 |  1.9% |      6.7 |
| 阿瓦隆玩法              |      0 |         252 |    0% |      8.6 |
| avalon juego de mesa    |     31 |       2,062 |  1.5% |      6.1 |

English rules: 555 clicks / 27,209 impressions; traditional Chinese rules: 54 / 3,994. Traditional Chinese home: 964 / 8,518. Preserve the established Chinese online-play and role-query coverage. Generic character-name impressions are not necessarily qualified demand: 蘭斯洛特 had 3,601 impressions and one click at position 1.3.

## Implementation checklist

- [x] Add a crawlable, localized invitation to play from rules and all 19 role pages, retaining the reader's language and stating the account requirement. A shared component provides an explicit play action and an optional rules link. Real Vue SSR tests exercise 114 role-page/language combinations.
- [x] Resolve contradictory detailed rules in all six languages, clarify original board-game versus platform behavior, and provide three anchorable answers to player-count, tied-vote and Merlin-victory questions. Keep the recent quick start and variant notes.
- [x] Clarify Russian and Spanish home copy and metadata; keep online-play intent on home and board-game explanation/rules on the existing rules URL. Do not create near-duplicate landing pages. Query-to-URL attribution for the Spanish broad query remains to be checked before any future URL restructuring.
- [x] Localize Portuguese titles for Lancelots, Guinevere and Excalibur. Morgana was already fixed in current source. Identical short Chinese support titles are not automatically evidence of harmful duplicate content.
- [x] Include YandexBot in the existing HTTP crawler-content verification alongside Googlebot.
- [x] Diagnose current LCP before making performance changes. No new performance defect was reproduced; no speculative performance patch was made.
- [x] Generate production assets, run SEO/hydration/navigation and nginx checks, and inspect mobile/desktop output.

## Verification

Production compilation, prerendering and critical CSS generation completed; all 184 UI tests passed. The initial build pipeline stopped in an existing browser assertion that depended on repeated Merlin mentions in the old article copy. The test now supplies and restores its own repeated-placeholder fixture, preserving the regression check without constraining editorial wording. The complete `check:build` suite subsequently passed against the generated production assets, including SEO, structured data, hydration/navigation, bundle/image budgets, password recovery, support and startup checks.

`check:seo:nginx` passed for languages, aliases, private routes, query strings, 404s and crawler HTML, including YandexBot. The final browser regression additionally passed for the mobile FAQ fragment, absence of horizontal overflow and a real Chinese-language play-link click. It dismisses the existing language suggestion banner before the click. Manual local browser inspection covered 390 px and 1280 px layouts and the Russian play transition. Formatting and `git diff --check` passed. These changes have not been deployed.

## Indexing findings

Yandex reported 24 pages with repeated titles and 14 with repeated descriptions, including old crawls of personal achievements, 404s and EN/PT articles. Current production HTTP responses on 28 September already return `X-Robots-Tag: noindex, follow` for the profile and sampled room. Existing nginx rules cover user statistics and achievements too. Avoid rewriting the working indexing policy solely because the search index has not caught up.

The `/?hl=zh-Hant-HK` example returned HTTP 200. A query-string URL in the index alone does not establish canonical failure; inspect the selected canonical and last crawl before introducing a redirect or Clean-param rule that could alter language behavior.

## Measurement after release

Fresh laboratory observations on the existing local build: mobile LCP 312 ms on home, 296 ms on rules, 268 ms on Merlin. These are single local navigations with CPU ×4/network throttling, external services blocked and CDN images served locally; they do not represent production LCP or prove field recovery. Published rules HTML already contains prerender and critical CSS. Detailed measurements and a reproducer are saved locally in `artifacts/lcp-audit-2026-09-28/` (ignored by Git). The 89 mobile URLs flagged by Google still require production/field follow-up.

Record the deployment date separately; local verification is not deployment. Compare equal completed 28-day intervals, separated by language, country, device and query cluster. Recent quick-start/home improvements already exist on production, so avoid attributing all later changes to this patch.

Use Search Console query + page dimensions to check which URLs answer the targeted queries, and look for competing pages before adding new landing pages. Evaluate landing visits together with existing room/game conversion events if available; this patch does not establish new conversion tracking.

Recheck Yandex's last crawl of the excluded service URLs and localized PT pages, then request re-crawl only if appropriate after publication. Recheck field LCP after enough new real-user data accumulates. Lab timings cannot prove that the field report is fixed.

A real game-creation video and review by a native Chinese editor remain external editorial work; do not represent generated text as native-reviewed or invent a gameplay recording.

## Sources

- [Google performance](https://search.google.com/search-console/performance/search-analytics?resource_id=https%3A%2F%2Favalon-game.com%2F)
- [Yandex query statistics](https://webmaster.yandex.ru/site/https:avalon-game.com:443/efficiency/statistics/)
- [Yandex duplicate metadata](https://webmaster.yandex.ru/site/https:avalon-game.com:443/indexing/double-descriptions/)
- [Google mobile Core Web Vitals](https://search.google.com/search-console/core-web-vitals/summary?resource_id=https%3A%2F%2Favalon-game.com%2F&device=2)
