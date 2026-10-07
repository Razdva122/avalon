# Player boards usability implementation plan

**Goal:** Implement the seven UX improvements approved in chat on 2026-10-07.
**Architecture:** Reuse community routes and the shared board form/cards. Apply filters in the backend before pagination; synchronize UI filters with route query parameters. Keep draft persistence in sessionStorage, scoped to user and board kind. Convert recurring schedules with Intl and disclose the original timezone.
**Tech stack:** Vue 3, Vue Router, TypeScript, Express, Mongoose, native Intl/sessionStorage.
**Spec:** The seven numbered proposals in this chat, explicitly approved by the user.

## Requirements

- All six locales; no additional dependencies.
- Preserve public access, owner actions, moderation and recruitment eligibility.
- Team browsing opens group listings; player browsing opens solo listings.
- Preserve existing local changes to contact guidance.

## Tasks

- [x] Direct lobby links, clear header/tabs and compact community board hero (navigation agent).
- [x] Shared board toolbar: collapsed rules, compact giveaway, voice/text/beginner filters, URL state and reset action.
- [x] Extend backend query validation/repository filtering before pagination; add route/validation regression tests.
- [x] Card contact actions and next-step copy guidance; local weekly schedule plus original schedule disclosure (cards agent).
- [x] Continue publishing after auth/account load; persist per-account/per-kind drafts in sessionStorage and clear after successful save.
- [x] Translate new UI copy in all locales; review changes and run UI/backend tests and production build.

## Verification

Exercise real query outputs and backend public route filtering; test URL back navigation and auth intent in the existing Vue harness. Verify drafts restore only for their owner and kind, corrupted/blocked storage does not break forms, and successful publication clears persistence. Test timezone conversions independently with literal expected dates/times. Run UI suite and scoped backend suites, then production UI build.

## Verification record

- 349 UI tests passed; 93 backend board tests passed.
- Review found a query-navigation scroll reset; fixed with history/filter/pagination regression coverage. Scoped re-review found no additional issues.
- Browser checks at desktop and 390px mobile: query filters, browser back, empty/reset state, guest publication login and username copy guidance. Direct page hydration has no console warnings/errors after matching the prerender/client loading state.
- Production build uses the installed Google Chrome via PUPPETEER_EXECUTABLE_PATH; no browser installation was needed.
