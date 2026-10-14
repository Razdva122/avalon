# International SEO Acquisition Launch Implementation Plan

> **For agentic workers:** use parallel scoped workers as explicitly requested by the owner; the root owns integration, combined verification and review. Steps use checkboxes for tracking.

**Goal:** Attract international players of adjacent social deduction games and preserve their path to a first human Avalon game.

**Architecture:** One lazy-loaded guide component and separate locale article chunks extend existing public-page generation. Complete `multiLanguage` metadata exposes all six supported language URLs. A guarded, small client helper connects guide actions to existing auth and room lifecycle hooks without a new telemetry service.

**Tech Stack:** Vue 3, Vue Router, Vuetify, TypeScript, Node's test runner, existing prerender/nginx and GA bootstrap.

**Spec:** `docs/superpowers/specs/2026-10-14-seo-acquisition-launch.md`

## Global Constraints

- Exactly three articles in all six supported languages in this release (18 URLs); no dependencies or fabricated translations.
- Preserve current bundle ceilings and public/private indexing policy.
- No commits by workers, production publication, external messages, analytics configuration or invented traffic/volume data.
- Shared working branch: `codex/seo-social-deduction`; workers edit disjoint owned files.
- User's explicit parallel execution request overrides sequential dispatch advice in workflow skills.

## Task 1: Guide content and renderer

**Files:** Create `packages/ui/src/pages/guides/Guide.vue`, `packages/ui/src/pages/guides/content.ts`, `packages/ui/scripts/guides-render.test.cjs`.

**Interfaces:** `Guide.vue` receives `guide: GuideId`; `GuideId` is `social_deduction_games_online | games_like_secret_hitler | avalon_vs_werewolf`. Each page data item has its corresponding hyphenated slug. The route passes `{ guide: route.name }`. CTA code calls `trackGuideVisit(slug)` on actual mount and `trackGuideCta(slug, 'lobby' | 'community' | 'ai')` for ordinary unmodified primary clicks. The bot action targets `/#play-with-ai`, anchored to the existing lobby launch control.

```ts
export type GuideId = 'social_deduction_games_online' | 'games_like_secret_hitler' | 'avalon_vs_werewolf';
// Guide.vue
const props = defineProps<{ guide: GuideId }>();
```

- [x] Verify official sources for every comparison; write distinct useful articles and a multiple-option hub.
- [x] Add a real Vue SSR regression asserting readable heading/content, EN links to play/rules/groups, setup requirements, valid table semantics and no unrendered data.
- [x] Observe the missing-guide failure; implement the shared renderer and data using existing `info-page.scss` and accessible responsive comparisons.
- [x] Keep article text/images outside the initial router chunk; run the owned render test and formatting.

## Task 2: SEO and discovery integration

**Files:** Modify `packages/ui/src/router/seo.js`, `packages/ui/src/router/index.ts`, `packages/ui/src/router/breadcrumbs.*`, `packages/ui/src/helpers/prerender.ts`, `packages/ui/src/components/header/LanguageChoices.vue`, `packages/ui/src/components/feedback/LanguageSuggestion.vue`, appropriate existing path helper/type/tests, English lobby/wiki discovery links and existing SEO HTTP/build checks. Inspect nginx before changing it; static directories already work.

**Interfaces:** Register the exact Task 1 route names and paths; all three lazy imports target `@/pages/guides/Guide.vue` and set the required prop. SEO metadata contains all six supported languages, including localized breadcrumbs. Body content loads through a lazy guide-locale module before navigation completes and never enters the initial router chunk.

```js
const guidePaths = {
  social_deduction_games_online: '/guides/social-deduction-games-online/',
  games_like_secret_hitler: '/guides/games-like-secret-hitler/',
  avalon_vs_werewolf: '/guides/avalon-vs-werewolf/',
};
```

- [x] Write/run path and public SEO tests proving all-six-language availability, same-article switching, general unavailable-language fallback and useful localized crumbs.
- [x] Register metadata/routes; include `guides` in the existing SSR article policy, with current hydration checks unchanged in strength.
- [x] Suggestions and explicit switching retain the same translated guide and its query/fragment. The generic unsupported-language fallback remains available for future partially translated pages.
- [x] Add crawlable localized entry points and article-to-hub navigation; update HTTP/build checks for all 18 canonical guide URLs returning 200, missing-slash redirects and English alias redirects.
- [x] Run owned path/SEO/navigation tests and report any whole-build assumptions to root.

## Task 3: Acquisition continuity and analytics

**Files:** Create a small `packages/ui/src/helpers/acquisition.ts` with owned behavioral tests; modify `AuthModal.vue`, `App.vue`, and the existing room state hook as needed after tracing actual snapshots and updates. Avoid lobby/route/guide edits owned by other workers.

**Interfaces:** Export the guide helper functions used by Task 1:

```ts
export function trackGuideVisit(slug: string): void;
export function trackGuideCta(slug: string, destination: 'lobby' | 'community' | 'ai'): void;
```

Accepted slugs are `social-deduction-games-online`, `games-like-secret-hitler`, `avalon-vs-werewolf`. Preserve the first guide source in guarded session storage/memory. A separate one-shot play intent is set by a friends/bots/community CTA and consumed/cleared after successful auth. Both friends and bots retain the lobby on matching auth. General registration must not inherit an old guide merely because it was visited.

- [x] Trace registration, welcome dialog, room seating and human/AI game lifecycle end-to-end; identify the real source of each event.
- [x] Write failing checks for signup return to a room/guide-origin lobby, unchanged general registration, invalid sources, unavailable analytics/storage, live completion deduplication and exclusions.
- [x] Implement the minimal helper and hooks. Use existing GA function; include only guide slug and non-sensitive categorical fields. No raw user, room or game identifiers in payloads.
- [x] Ensure an analytics error never interrupts signup, routing or gameplay. Do not mark a finished snapshot/archive or spectator as a newly completed game.
- [x] Run focused tests and document event names, source attribution limits and required post-release cohort configuration.

## Task 4: Research, integration and release verification (root)

**Files:** Create `docs/seo-acquisition-2026-10-14.md` with keyword clusters, exact target URL assignments, source dates, public editorial prospects, event semantics and remaining post-release measurements.

- [x] Compile 40–60 candidate query phrases into the three existing target pages; clearly distinguish deferred Among Us/Chinese opportunities and unmeasured volumes.
- [x] Collect 15 public editorial prospects/adjacent resources and check their topic/excerpts. Prioritize relevant existing recommendations; disclose pending publisher/contact/link-policy qualification and record outreach as future work, never send messages.
- [x] Read every worker diff, resolve shared contracts and run complete UI build/checks using installed Chromium.
- [x] Verify HTTP responses, sitemap, canonical/hreflang, hydrated content and ordinary language/CTA navigation. Inspect mobile and desktop output through the browser.
- [x] Run combined spec/code review and fix material findings; finish with `git diff --check` and accurate local-delivery notes.

## Progress

- Branch created from clean `master`: `codex/seo-social-deduction`.
- Three scoped workers dispatched in parallel; initial investigation complete.
- Task ownership prevents content/router/auth file collisions. No worker edits began before this contract was saved.

- All locally executable tasks completed. Final evergreen bot wording, 482-test production pipeline, HTTP/nginx checks and desktop preview verified; independent review passed.
- The owner later requested complete six-language translations of all three guides. Production deployment, analytics account configuration, publisher qualification and outreach remain future work.
- The six-language expansion is locally complete: 18 complete guide versions, lazy locale chunks, translated metadata and navigation, 485-test production build, all route budgets and HTTP checks passed. Same-article locale visit tracking was reviewed and verified with a real Vue Router regression test.
