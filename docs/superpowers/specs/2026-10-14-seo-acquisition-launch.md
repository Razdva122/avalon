# International SEO acquisition: first release

The owner approved the international acquisition strategy in chat on 14 October 2026 and requested parallel subagents to begin implementation. This release delivers the immediately executable first batch; traffic experiments, editorial outreach and additional languages follow measured results.

## Deliverables

1. Three substantive public articles in all six supported languages (18 URLs), with unprefixed English paths: `/guides/social-deduction-games-online/`, `/guides/games-like-secret-hitler/`, `/guides/avalon-vs-werewolf/`. Help a group choose its next social deduction game, accurately compare rules, and explain its first Avalon round.
2. Existing site styling, real existing gameplay preview where suitable, semantic comparisons, visible setup requirements, links to rules, lobby, bot play and group boards. Crawlable localized links from established lobby and wiki pages. No invented gameplay recording. The owner's later steering requires an explicit solo/small-group bot learning path alongside ordinary human games; link to the existing lobby AI setup via `/#play-with-ai`.
3. Prerendered and hydrated content, canonical URLs, sitemap inclusion, meaningful breadcrumbs and existing structured data. Each version has its own canonical URL, all six language alternates and English x-default. Explicit language switches and preferred-language suggestions retain the same article, query and fragment. Only genuinely unknown paths remain 404.
4. Play intent survives successful registration on a room link or a guide-origin lobby, bot or community action. A bot action retains the existing lobby AI setup. General profile registration retains existing profile/welcome behavior.
5. Small analytics integration using the existing GA bootstrap: guide visits/CTAs, successful registration, confirmed human-room participation and live completion by an observed participant. Store only an allowlisted initial guide slug; never send account identity, email, raw URL/query, room/game identifiers. Missing/blocked analytics or storage and prerendering must be harmless. Completion excludes spectators, archived results, AI games and repeated state updates.
6. A dated keyword/intents map, publicly verified editorial prospect list, and measurement/release instructions. Keyword candidates are not measured search volumes. Do not contact anyone, modify analytics account settings, submit sitemaps or publish production in this local release.

## Product and implementation constraints

- Ordinary human Avalon is free, browser-based and requires 5–10 players, each with an account and device. Text chat and optional voice are supported. Group boards coordinate players; they do not guarantee immediate matchmaking.
- AI supports Solo and With friends, with bots filling empty seats; discussions support EN/RU/traditional Chinese. An account and current mode availability are required. At implementation time the backend exposes 2–3 humans in friends mode and 5–8 total seats, but the owner subsequently required those temporary limits to be omitted from evergreen SEO copy. Public text must direct players to setup for available sizes and Premium labels, without promising unlimited current play. Keep internal quota/shared-slot details out of the product flow. Backend limits are unchanged by this editorial release.
- Compare classic Werewolf/Mafia elimination with Avalon; distinguish One Night variants. Secret Hitler also has browser implementations. Among Us is an installed action/deduction alternative, not a browser game in the shortlist.
- This site's fifth proposed team proceeds after four rejected proposals; its evil team handles assassination. Clearly distinguish platform behavior from rules of the physical game.
- English is unprefixed. Preserve all existing translated URLs, private-route noindex, 404 behavior, language preference and bundle budgets.
- Reuse Vue 3/Vuetify, existing static generation and styles. Add no dependencies, fake translations, unrelated redesigns or speculative analytics backend.

## Acceptance

Run owned behavior tests before implementation where behavior changes, then the complete UI production pipeline and HTTP/nginx checks. Inspect guide pages at desktop/mobile widths and verify links, keyboard access, overflowing tables, language switching and CTA behavior. Review the combined diff for factual accuracy, SEO discoverability, auth regression and telemetry duplicates. Delivery distinguishes local verification from publication and actual search results.
