# Role image framing implementation plan

**Goal:** Audit all 25 role images in each of the three styles and choose framing for the wiki gallery, role pages, and game icons.

**Architecture:** Keep the original assets. Share square portrait framing through the existing image/style helpers and SchemaImage; retain separate circle framing in PlayerIcon. Use the compiled Vue components for visual verification.

**Tech stack:** Vue 3, TypeScript, SCSS, existing Node tests and Puppeteer.

**Requirements:** User requests an individual image audit, including in-game and role-page presentation. Preserve earlier profile fixes, style persistence, thumbnails, and non-role artwork. No additional dependencies or deployment.

- [x] Inspect contact sheets of all original images and current square/circle crops, including hidden/progress/mystery variants.
- [x] Choose per-image portrait focus and correct any game circles that lose the face or meaningful role details.
- [x] Add a meaningful regression check for shared style selection, aliases, variants, and reactive preference changes before implementing lookup logic.
- [x] Apply the same portrait framing to gallery and individual role pages; keep circular framing separate.
- [x] Verify all styles, gallery links, role pages, game player components, large role information icons, and thumbnail icons at desktop/mobile sizes.
- [x] Run UI tests, type/build checks, inspect the final diff, and report the verified result.

**Verification:** 269 UI tests pass; development build including TypeScript checks passes. Local Chrome verified 246 square portraits across the gallery and 18 role pages at 1280px/375px in all three styles; mounted game Player components for all 75 images with full artwork and 24px thumbnails, plus the actual 250px role dialog and 200px/50px loyalty announcements. Independent code review found no functional regressions. Screenshots were inspected; source artwork is unchanged.
