# Community player boards

[Documentation index](README.md)

The Community page has three tabs: community servers (selected by default), looking for a group, and looking for players. Each player board loads when its tab is selected:

- `solo`: a signed-in player looks for a group.
- `group`: a signed-in player recruits others after participating in a completed, non-manually-ended game. The server checks saved game participation and a good/evil winner.

Each account has one retained listing per board. Initial publication and reactivation of an expired listing last 30 days. An active listing can be bumped after seven full days; this updates ranking and renews expiry for 30 days from that bump. The card’s active-since date is the latest bump date. After 30 days without a bump, the listing is excluded from public results on both boards. Edits preserve ranking and expiry. Hiding is immediate and retains the data; a hidden, unexpired listing can be activated immediately with its previous ranking and expiry, so hiding and restoring cannot bypass the bump cooldown. Expired listings disappear from public reads automatically, without deleting them or requiring a scheduled job.

## Fields and contacts

Listings use structured languages, weekdays, hours, IANA time zone, voice/text preference, experience, a teaching flag and, for recruiting, a required group name (1–60 characters), current group size (1–10), and a beginners-welcome flag. Schedule is optional (`scheduleEnabled`, off by default in the form). Enabling it reveals weekdays, hours and time zone; disabling it removes the schedule from cards and normalizes stored days/hours/time zone to empty values. Enabled days and hours are displayed in the author's explicitly labelled time zone. An ending hour before the start means the next day; equal hours are rejected.

One or two public account IDs are supported: WeChat, QQ, LINE, Discord, Telegram. Recruiting listings can also use a QQ group number. Solo listings accept account IDs. Group listings also accept HTTPS invitation links for Discord, Telegram, LINE and QQ groups. Shared validation checks exact platform hosts and supported paths; valid invitations have an external link and a separate copy-link action. WeChat uses an organizer ID to arrange an invitation or QR code. Contacts are public and the form explains this. New contacts require an explicit platform choice from visible icon buttons; no messenger is selected automatically. Existing contacts use the same buttons to change platforms, with the selected platform marked by a border and checkmark. A platform already used by the other contact is disabled. There are no user descriptions, comments, uploaded QR codes or in-app messages. Solo nickname/avatar come from the existing account profile. Recruiting cards show the group name and no avatar. The unused vacancy-count field was removed entirely; there is no legacy-format compatibility. All six interface languages are provided.

## Moderation

Signed-in users can report spam, abuse or an incorrect contact. Repeated reports from the same account are deduplicated; reports never automatically hide a listing.

An account with the existing database `isAdmin: true` flag sees **Review reports** on Community. It can hide a reported listing, ban/unban an author's board publications, and dismiss reports. The separate banned-user list remains available after reports are dismissed. Ban authority is checked server-side, never trusted from the client. A moderator-hidden listing cannot be edited or reactivated by its owner.

## Backend and deployment

The Express API is mounted under `/api/player-boards`; `nginx.conf` proxies the same path in production. The UI uses the existing Bearer-token session and localhost:3000 in development. All responses are `Cache-Control: no-store`.

Startup explicitly creates indexes for `PlayerBoardListing`, `PlayerBoardReport`, and `PlayerBoardAuthor`, including unique owner/kind, listing/reporter, and author ID indexes. This is required because normal production database connections disable automatic index creation. These are new collections; existing user and game records are not migrated.

API:

- `GET /?kind=solo|group&language=cmn&page=1`: public page (20 listings, `hasMore`). Omit `language` for all languages.
- `GET /me`: private listings, recruiting eligibility, publication ban and admin status.
- `GET /members?query=...`: authenticated case-insensitive public-name prefix search, 2–80 characters, at most ten `{userID,name,avatar}` results.
- `PUT /me/:kind`: create or edit only whitelisted `BoardDraft` fields.
- `POST /me/:kind/bump|hide|reactivate`: owner lifecycle actions.
- `POST /:id/report` with `{reason: 'spam'|'abuse'|'contact'}`.
- `GET /moderation`, `GET /moderation/bans`: admin reports and publication bans.
- `POST /moderation/:id/hide|dismiss`.
- `POST /moderation/users/:userID/ban` with `{banned: boolean}`.

DTOs are defined in `packages/types/player-board.ts`. All rules are enforced on the server, including atomic cooldown predicates, blocked publication and unique listing ownership.

Recruiting drafts optionally list `memberIDs`: up to ten distinct registered accounts and at most `groupSize`. Solo drafts cannot contain members. Older drafts normalize omitted IDs to `[]`; public listing `members` includes current names and avatars only. Members can be added, removed or edited without changing listing rank or expiry. Unknown accounts return `invalid_members`.

Active listings can enter the [weekly lifetime Premium giveaway](payments/weekly-giveaway.md): one ticket per listing, Sunday 20:00 Asia/Yekaterinburg, one solo recipient and one distinct recruiting recipient. Existing Premium and banned accounts cannot receive prizes. A recruiting listing without explicit members uses its author; a listing whose explicit members are all ineligible has no ticket for that draw.

## Verification

Backend integration tests run against a real temporary MongoDB and HTTP server with production `autoIndex:false`. They cover completed-game eligibility, JWT session revocation, validation, expiration boundaries, ownership, concurrent create/bump/reactivate, ban races, report deduplication, explicit index creation and filtered pagination.

UI tests cover draft projection, cooldown/status helpers, filtering query construction, localized transport errors, production proxy coverage, stale account/filter responses and failed-save recovery. Browser verification additionally exercises Traditional Chinese, explicit platform selection, publish/edit, the recruiting gate, and 375px layouts. No live accounts or public listings were created during verification.

Verified 2026-09-29: 61 backend suites / 477 tests; 209 UI unit tests; production build and its SEO, navigation, bundle, images, recovery, support, startup and Web Vitals checks passed. Production prerender used the locally installed Chrome via `PUPPETEER_EXECUTABLE_PATH`. Temporary Mongo tests used an existing cached binary via `MONGOMS_SYSTEM_BINARY`. Review findings were fixed and re-reviewed. These results describe the 2026-09-29 local verification; check deployment independently.

## Local demo listings

From `packages/backend`, run `NODE_ENV=development ../../node_modules/.bin/ts-node src/scripts/seedPlayerBoards.ts` to seed eight clearly labelled DEMO profiles (four solo, four groups). It only accepts loopback MongoDB in development, uses fixed fixture IDs, and never inserts fake games or changes existing real accounts. Contacts are illustrative only. Rerunning refreshes those fixtures rather than duplicating them. Add `--remove` to remove only the demo profiles/listings and their reports.

Additional verification recorded during the board revision: 48 backend board tests, 209 UI tests and the production build passed. Browser checks confirmed group names without avatars, colored contact icons, experience/communication icons, group-only beginner badges and mobile layout.

Invitation guidance: [Discord](https://support.discord.com/hc/en-us/articles/208866998-Invites-101), [Telegram](https://www.telegram.org/faq), [LINE](https://help.line.me/line/desktop/?contentId=20008159). Link validation checks format, not whether an invitation has expired. Language flags are decorative and always accompanied by language names.

Custom languages: select `other` and enter `otherLanguage` (1–60 characters, Unicode letters with spaces and simple separators). Cards show this text; `language=other` filters both boards. Clearing the selection clears stored custom text. Invitation URLs also reject fragments, unexpected query parameters, credentials, non-HTTPS schemes and encoded/path-normalization tricks. Validation does not confirm invitation availability or destination membership.

## Search usability

The lobby links directly to teams and players; the header opens teams, and tabs describe the listings shown. The board heading is compact, rules are a disclosure, and the giveaway is a short notice. Language, communication and beginner-friendly filters are encoded in the page URL. Communication filters include listings accepting either voice or text. Filters run before pagination in the backend. Same-page filter changes preserve scroll; pagination returns to the board and browser history restores saved scroll.

Publication intent survives sign-in and opens the form after the account permissions load. In-progress drafts are saved in sessionStorage per account, board kind and listing ID, restored when the form reopens, and cleared after a successful publication. They stay within the current browser tab. A discard action restores the saved listing or the defaults. Disabled storage does not prevent editing or saving.

Invitation actions read “Join the team”; username copy actions explain the next step in Discord or Telegram. Weekly schedules are converted into the visitor timezone, including weekday shifts and fractional offsets. The reference week is shown because daylight saving changes can alter the conversion. The original schedule remains available in a disclosure. Listings without a schedule show “Time by agreement”.
