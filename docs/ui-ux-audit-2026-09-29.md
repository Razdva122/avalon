# UI/UX audit — 2026-09-29

> Historical record: findings, measurements and plans describe their recorded date. For current setup and operations, use the [documentation index](README.md).

Applied frontend-design and ui-ux-pro-max guidance, retaining Avalon's existing character artwork and restrained gold accents.

## Changes

- Light and dark surfaces now distinguish background, cards and navigation. Secondary text and borders use shared tokens.
- Header gains direct desktop links; mobile hides external social shortcuts, which remain available in the menu. Buttons have accessible labels and focus outlines. Menu scrolls on short screens.
- Reading pages have bounded width, consistent spacing, responsive headings and clearer breadcrumbs. Role catalog uses a responsive grid with full labels.
- Leaderboard selectors are native keyboard-operable buttons. Statistics states and table surfaces, About, profile spacing and the 404 return link were refined.
- Community retains three tabs. Player boards use localized single-language filter buttons, including All languages. Mandarin and Cantonese are separate. Listing form uses independent checkboxes instead of a multi-select requiring modifier keys.
- WeChat, QQ, LINE, Discord and Telegram icons accompany contact names. SVGs are from the installed Font Awesome Free package (CC BY 4.0); no external icon requests.
- Fixed dark-theme join-button contrast by using the paired on-primary color.

## Verification and boundaries

- 38 routes opened at 1366×900 and 375×812: 76 navigations, no horizontal document overflow or uncaught JavaScript errors. Russian UI was used for this sweep.
- Additional real local API checks: three community tabs, keyboard switching, four solo/four group fixtures, Russian filter results, demo-account edit form, authenticated profile and a completed game room.
- Completed-room rendering was confirmed once. A subsequent repeat stayed on the loading screen waiting for the existing `joinRoom` acknowledgement, including after reload; REST API remained available. This room-loading issue is not resolved by the visual changes.
- Community inspected in light and dark themes. Labels added for all six supported locales. This is not a manual screenshot audit of every locale and every live game state.
- 209 UI tests; production build and bundled SEO, navigation, assets, startup, recovery, support and Web Vitals browser checks.
- Critical CSS remains within the existing 8 KiB gzip budget; unused generated color utilities were avoided rather than raising the budget.

Temporary audit screenshots and logs: `/tmp/avalon-ux-audit/`. No production deployment or changes to live player accounts.
