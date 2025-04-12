# Decision Log

This file records architectural and implementation decisions using a list format.
2025-04-13 00:04:28 - Log of updates made.

-

## Decision

- Implement mobile adaptation for UserHoverCard using @vueuse/core library's useLongPress function

## Rationale

- The initial implementation had limitations on mobile devices:
  - Hover interactions are not available on touch devices
  - The click event on Player component is already used for player selection in game logic
  - Mobile users couldn't access the user information displayed in the hover card
- After evaluating multiple approaches:
  - Custom long press directive: More code to maintain, potential compatibility issues
  - Vuetify components (v-bottom-sheet, v-menu): Good UX but more complex implementation
  - @vueuse/core: Balanced solution with minimal code changes and good UX
- @vueuse/core provides:
  - Ready-to-use long press detection with configurable delay
  - TypeScript support and Vue 3 Composition API compatibility
  - Active community maintenance and updates
  - Additional useful composables for future mobile optimizations

## Implementation Details

- Install @vueuse/core as a project dependency
- Modify Player.vue to use useLongPress for detecting long press gestures on mobile
- Add a v-dialog component to display UserHoverCard content on mobile devices
- Use media queries to differentiate between desktop and mobile interactions
- Provide visual feedback during long press with subtle animation
- Maintain the existing v-tooltip for desktop hover interactions
- Optimize UserHoverCard styles for better display on mobile devices

## Previous Decision

- Modify UserHoverCard implementation to use Vuetify's v-tooltip component instead of custom positioning

## Previous Rationale

- The initial implementation had visual issues:
  - The hover card could be overlapped by other elements
  - It could extend beyond screen boundaries
  - The positioning was fixed and didn't adapt to different screen sizes or positions
- Vuetify's v-tooltip component provides:
  - Proper z-index handling to prevent overlapping
  - Automatic positioning to stay within screen boundaries
  - Consistent appearance with other tooltips in the application
  - Built-in transition effects and delay options

## Previous Implementation Details

- Wrap the Player component content in a v-tooltip component
- Use v-tooltip's built-in delay options (open-delay="1000") instead of manual timer handling
- Simplify the UserHoverCard component by removing positioning styles
- Ensure consistent styling with other tooltips in the application
- Remove manual timer handling since v-tooltip has built-in delay functionality
