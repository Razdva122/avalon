# Decision Log

[2025-04-23 18:36:45] - **Updated Wraith Role Text in All Languages**

Updated the Wraith role text in all language files to use the consistent description "Unknown to Evil and Merlin" with appropriate translations:

- English: "Unknown to Evil and Merlin"
- Russian: "неизвестен силам тьмы и Мерлину"
- Spanish: "Desconocido para los Malvados y Merlín"
- Portuguese: "Desconhecido para o Mal e Merlin"
- Chinese (Simplified): "坏人方和梅林都不知道你的存在"
- Chinese (Traditional): "壞人方和梅林都不知道你的存在"

This ensures consistent role description across all supported languages.

[2025-04-23 18:20:56] - **Added Wraith Role Text and Information**

**Decision**: Added text for the Wraith role and updated rolesInfo to include wraithInfo with the text "неизвестен силам тьмы и Мерлину" (unknown to the forces of darkness and Merlin).

**Rationale**:

1. The Wraith role was already implemented in the backend but lacked proper text in the UI
2. The role needed a description that explains its unique position in the game
3. The text needed to be added to the Russian language file to maintain consistency

**Implementation Details**:

- Added "wraith" role name to the Russian language file as "Призрак"
- Added "wraithInfo" with the text "неизвестен силам тьмы и Мерлину"
- The Wraith is a servant of Mordred who is hidden from both the forces of darkness and Merlin

**Implications**:

- The Wraith adds a new layer of complexity to the game
- Neither Merlin nor the evil players can identify the Wraith
- This creates interesting gameplay dynamics where even evil players don't know all their teammates

[2025-04-23 16:03:00] - **TrueSkill Rating Adjustment Factor Reintroduction**

**Decision**: Reintroduce a simplified adjustment factor to make TrueSkill rating changes more proportional to player ratings.

**Rationale**:

1. Initial testing of the new team balancing approach showed that players with very different ratings were receiving similar rating changes
2. This behavior was counterintuitive to users who expected higher-rated players to lose more points when losing
3. A simplified adjustment factor (30% influence) was added to make rating changes more proportional to player ratings
4. The adjustment factor considers a player's rating relative to their team's average

**Implementation Details**:

- Added calculation of team average mu in the `processTeamChanges` method
- Introduced a relative skill factor that compares player's rating to team average
- Applied different adjustment rules for winners and losers:
  - Winners: Higher skilled players get smaller gains, lower skilled players get larger gains
  - Losers: Higher skilled players get larger penalties, lower skilled players get smaller penalties
- Limited the adjustment factor to a reasonable range (0.7 to 1.3)
- Applied the adjustment factor to mu changes while keeping sigma changes as calculated by TrueSkill

**Implications**:

- Rating changes will now be more intuitive and proportional to player ratings
- Higher-rated players will lose more points when losing and gain fewer points when winning
- Lower-rated players will lose fewer points when losing and gain more points when winning
- The system maintains the core TrueSkill algorithm while adding a layer of intuitive adjustment

[2025-04-23 14:48:00] - **TrueSkill Team Balancing Redesign**

**Decision**: Implement a new team balancing approach for TrueSkill rating calculations by adding fake players to the evil team with average ratings of real evil players.

**Rationale**:

1. The current normalization approach adjusts both teams to a fixed size (5 players)
2. In Avalon, the evil team is always smaller than the good team by game design
3. Adding fake players to the evil team with average ratings provides a more intuitive and fair balancing method
4. This approach eliminates the need for complex normalization and mapping algorithms

**Implementation Details**:

- Add a new `balanceTeams` method to add fake players to the evil team
- Remove the current normalization methods (`normalizeTeam`, `mapNormalizedRatingsToOriginal`)
- Remove the skill adjustment factor calculations and use the TrueSkill algorithm directly
- Only process rating changes for real players
- Detailed implementation plan created in [trueskill-team-balancing-implementation.md](./trueskill-team-balancing-implementation.md)

**Implications**:

- Simpler, more intuitive rating calculation process
- More accurate representation of team balance in Avalon
- Easier to understand and maintain codebase
- Rating changes will be determined solely by the TrueSkill algorithm

[2025-04-23 14:25:00] - Added detailed TrueSkill rating calculation logging

- Added comprehensive logging for TrueSkill rating calculations for game ID: 6338462f-e649-4049-9490-376fe79f38f5
- Modified `trueSkillCalculator.ts` to log detailed information about the rating calculation process
- Added logging to three key methods:
  1. `calculateTrueSkillChangesForGame`: Logs initial ratings, team composition, and calculation parameters
  2. `processTeamChanges`: Logs detailed per-player rating changes and adjustment factors
  3. `calculateSkillAdjustmentFactor`: Logs the detailed calculation of adjustment factors that determine how much ratings change
- This will help with debugging and understanding how the TrueSkill system calculates rating changes
- The logging is targeted to a specific game ID and won't affect normal operation

[2025-04-22 19:40:26] - Implemented TrueSkill Rating System

**Decision**: Implement a TrueSkill rating system alongside the existing ELO system to provide a more accurate measurement of player skill in team-based games.

**Rationale**:

1. The TrueSkill system is specifically designed for team-based games, making it more suitable for Avalon than traditional ELO.
2. TrueSkill tracks both skill (mu) and uncertainty (sigma), allowing for better handling of new players and skill changes.
3. The system can normalize teams of different sizes, ensuring fair rating calculations regardless of team composition.
4. TrueSkill provides more nuanced rating adjustments based on individual performance relative to team average.

**Implementation Details**:

- Used the ts-trueskill library as the foundation
- Customized parameters: mu (6000), sigma (1500), beta (1200), tau (35)
- Added team normalization to handle different team sizes
- Implemented skill adjustment factors to provide fair rating changes
- Created database models for storing ratings, game results, and history
- Added API endpoints for accessing TrueSkill data
- Integrated TrueSkill display in user profiles and hover cards

**Implications**:

- Players will have two separate ratings (ELO and TrueSkill)
- TrueSkill provides a more accurate representation of player skill in team games
- The system will adapt more quickly to skill changes, especially for new players
- Rating changes will be more fair, with adjustments based on relative team performance

[2025-04-21 12:42:58] - **TrueSkill API Method Refactoring**

**Decision:** Replace `getPlayerTrueSkillChanges` with `getMatchTrueSkillChanges` in TrueSkill rating endpoints.

**Rationale:**

- The previous implementation required fetching all player games and then filtering by game ID
- This was inefficient when displaying game-specific rating changes in the UserStats view
- A direct method to get changes by match UUID is more efficient and logical

**Implementation Approach:**

1. Add new `getMatchTrueSkillChanges` method to the TrueSkill socket events interface
2. Implement the backend endpoint to retrieve TrueSkill changes by game ID
3. Update UserStats.vue to use the new method for each game in the last games list

**Technical Details:**

- Added new method to `TrueSkillSocketEvents` interface in trueskill-sockets.ts
- Implemented backend handler in trueSkillRatingEndpoints.ts
- Modified UserStats.vue to make one API call per game instead of one call for all player games

**Implications:**

- Improved performance by reducing unnecessary data transfer
- More logical API design that follows the principle of specific endpoints for specific data
- Better code organization and maintainability

[2025-04-17 00:03:47] - **ELO Expected Score Calculation Adjustment**

**Decision:** Modify the ELO expected score calculation to provide more realistic win probabilities for games with large rating differences.

**Rationale:**

- The standard ELO formula gives unrealistically high win probabilities for large rating differences
- A player with a 1000 rating advantage had ~95% expected win probability
- This led to minimal rating gains for wins and excessive penalties for losses
- User feedback indicated that a ~70% win probability would be more realistic for a 1000 rating difference

**Implementation Approach:**

1. Change the divisor in the ELO formula from 400 to 800
2. This flattens the probability curve, giving more balanced expected outcomes
3. Update all documentation to reflect this change

**Technical Details:**

- Modified the `calculateExpectedScore` method in `eloCalculator.ts`
- Changed formula from: 1 / (1 + 10^((opponentRating - playerRating) / 400))
- To: 1 / (1 + 10^((opponentRating - playerRating) / 800))
- Updated all documentation to reflect the new formula and its effects

**Implications:**

- A player with a 1000 rating advantage now has ~70% expected win probability instead of ~95%
- Players will gain more points for winning and lose fewer points for losing when there's a large rating difference
- This creates more balanced rating changes and better reflects actual game outcomes
- The divisor (800) can be further adjusted if needed based on player feedback

[2025-04-16 22:18:16] - **ELO Rating System Enhancement**

**Decision:** Enhance the ELO rating system to better account for team strength differences when calculating rating changes.

**Rationale:**

- The previous implementation had minimal team influence on rating changes (±1 point deviation)
- Strong players weren't sufficiently rewarded for winning with weaker teammates
- Team composition should have a meaningful impact on rating adjustments

**Implementation Approach:**

1. Calculate the difference between average ratings of opposing team and player's team
2. Apply a team strength factor (15% influence) to adjust the base rating change
3. Scale the adjustment proportionally to the team rating difference
4. Document the changes thoroughly with diagrams and implementation guides

**Technical Details:**

- Team Strength Factor = 1 + (Team Rating Difference / 2000) \* 0.15
- Adjusted Rating Change = Base Rating Change \* Team Strength Factor
- Created comprehensive documentation in:
  - elo-rating-system-updates.md
  - elo-rating-system-diagram.md
  - elo-implementation-guide.md
  - rating-systems-comparison.md

**Implications:**

- Players on weaker teams will gain more points for winning and lose fewer for losing
- Players on stronger teams will gain fewer points for winning and lose more for losing
- The system now better reflects individual performance within team dynamics
- The 15% influence factor can be adjusted if needed based on player feedback

[2025-04-13 15:17:27] - **Plot Cards Refactoring Decision**

**Decision:** Refactor the plot cards system to use an array of active cards (`activeCards`) instead of a single active card (`activeCard`), and add support for passing card IDs from the frontend to the backend.

**Rationale:**

- The previous implementation only supported one active card at a time, which limited gameplay possibilities
- By using an array of active cards and identifying them by ID, we can support multiple active cards of the same type simultaneously
- This change enables more complex game scenarios and interactions between cards

**Implementation Approach:**

1. Update backend interfaces to include optional `cardID` parameters for backward compatibility
2. Modify methods to find specific cards in the `activeCards` array based on the provided ID
3. Update socket handlers and type definitions to support the new parameters
4. Ensure test helpers work with the new system

**Implications:**

- Frontend code will need to be updated to pass card IDs when calling plot card-related methods
- This change maintains backward compatibility while enabling new functionality
- The system is now more flexible and can support more complex game scenarios

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
