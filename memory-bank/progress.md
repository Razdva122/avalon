# Progress

[2025-04-22 19:40:42] - Implemented TrueSkill Rating System

Completed the implementation of a TrueSkill rating system as an alternative to the existing ELO system. The TrueSkill system provides a more accurate measurement of player skill in team-based games like Avalon.

**Completed Tasks:**

1. Created core TrueSkill calculation system in `trueSkillCalculator.ts`

   - Implemented team normalization for different team sizes
   - Added skill adjustment factors for fair rating changes
   - Configured system parameters (mu, sigma, beta, tau)

2. Set up database models and migration

   - Created `PlayerTrueSkillRating`, `GameTrueSkillResult`, and `TrueSkillRatingHistory` models
   - Implemented migration to create collections and indexes
   - Added backfill functionality to process existing games

3. Developed API endpoints in `trueSkillRatingEndpoints.ts`

   - Added `getTrueSkillRating`, `getTrueSkillLeaderboard`, and `getMatchTrueSkillChanges` endpoints
   - Registered endpoints in main.ts

4. Created frontend components

   - Implemented `UserTrueSkillRating.vue` component
   - Integrated TrueSkill display in user profiles and hover cards
   - Added internationalization support for TrueSkill UI elements

5. Added automatic rating updates
   - Implemented `updateTrueSkillForGame` for immediate updates
   - Created `createTrueSkillRatingSnapshot` for historical tracking

**Next Steps:**

1. Monitor TrueSkill rating distribution and adjust parameters if needed
2. Gather user feedback on the new rating system
3. Consider adding more detailed TrueSkill statistics and visualizations
4. Evaluate if TrueSkill should eventually replace ELO or remain as an alternative

[2025-04-13 15:17:39] - **Plot Cards Refactoring Completed**

Completed the refactoring of the plot cards system to use an array of active cards (`activeCards`) instead of a single active card (`activeCard`), and added support for passing card IDs from the frontend to the backend.

**Completed Tasks:**

1. Updated interfaces in `game-manager/interface.ts` to include optional `cardID` parameters
2. Modified methods in `game-manager/index.ts` to find specific cards in the `activeCards` array
3. Updated socket handlers in `main.ts` to accept and pass the `cardID` parameter
4. Updated socket type definitions in `sockets.ts` to include the `cardID` parameter
5. Updated the `makeVote` method in `ChargeCard` class to accept and use the `cardID` parameter
6. Updated test helpers to work with the new system
7. Created documentation in the Memory Bank about the changes

**Next Steps:**

1. ✅ Update the frontend to pass card IDs when calling plot card-related methods
2. Test the changes with multiple active cards of the same type
3. Update user documentation to reflect the new functionality

[2025-04-13 15:22:16] - **Frontend Updates Completed**

Updated the frontend components to pass card IDs when calling plot card-related methods:

1. **LoyaltyCardActions.vue**:

   - Updated to pass the active card ID when calling `checkLoyalty` and `revealLoyalty` methods

2. **AnnounceLoyalty.vue**:

   - Updated to use `getLoyaltyWithCard` when an active card ID is available
   - Updated to pass the card ID when calling `announceLoyalty`

3. **PlotCardsPanel.vue**:
   - Added a `getActiveCardByType` helper method to find active cards by type
   - Updated `leadToVictoryClick`, `kingReturnsClick`, and `weFoundYouClick` methods to pass the card ID
   - Updated `emitClick` method to pass the card ID for the `useAmbush` method

The system now fully supports having multiple active cards of the same type simultaneously, with the frontend correctly identifying and passing the specific card ID to the backend.

[2025-04-13 15:25:37] - **Added Dedicated Socket Methods with Required CardID Parameters**

Added new socket methods with required cardID parameters for better type safety:

1. Added new socket methods in `sockets.ts`:

   - `checkLoyaltyWithCard(uuid: string, cardID: string)` - Requires a cardID parameter
   - `revealLoyaltyWithCard(uuid: string, cardID: string)` - Requires a cardID parameter

2. Updated socket handlers in `main.ts` to handle these new methods

3. Updated `LoyaltyCardActions.vue` to use the new methods when a card ID is available:
   - Uses `checkLoyaltyWithCard` instead of `checkLoyalty` when a card ID is available
   - Uses `revealLoyaltyWithCard` instead of `revealLoyalty` when a card ID is available

This approach provides better type safety by making the cardID parameter required in the dedicated methods while maintaining backward compatibility with the original methods.

[2025-04-13 15:32:35] - **Made cardID a Required Parameter**

Updated the system to make cardID a required parameter in all plot card-related methods:

1. Updated socket type definitions in `sockets.ts`:

   - Changed `preVote`, `useLeadToVictory`, `useAmbush`, `useKingReturns`, and `useWeFoundYou` to require cardID

2. Updated interface definitions in `game-manager/interface.ts`:

   - Changed `TPreVoteParams`, `TUseLeadToVictoryParams`, `TUseAmbushParams`, `TUseKingReturnsParams`, and `TUseWeFoundYouParams` to require cardID

3. Updated socket handlers in `main.ts` to expect required cardID parameters

4. Removed unnecessary cardID null checks in `game-manager/index.ts` since cardID is now required

5. Updated frontend components to always provide a valid cardID:
   - Added error handling in `PlotCardsPanel.vue` to prevent sending requests without a valid cardID
   - Updated `LoyaltyCardActions.vue` to only use the WithCard methods and require a valid cardID
   - Updated `AnnounceLoyalty.vue` to require a valid cardID

This approach ensures type safety by making cardID a required parameter throughout the system, eliminating the need for null checks on the backend.

[2025-04-13 22:20:26] - **Updated Memory Bank Documentation for Plot Cards CardID Requirement**

Created a dedicated documentation file `plot-cards-cardid-update.md` that provides comprehensive information about the cardID requirement for plot cards:

1. Detailed explanation of the cardID requirement and its purpose
2. Examples of frontend implementation showing how to retrieve and pass the cardID
3. Information about backend processing of the cardID parameter
4. Developer guidelines for implementing new plot cards or modifying existing ones

This documentation will help developers understand the importance of including the cardID when using plot cards and provide guidance on how to implement it correctly.

This file tracks the project's progress using a task list format.
2023-04-12 05:28:00 - Log of updates made.

-

[2025-04-16 22:18:52] - **ELO Rating System Enhancement Completed**

Enhanced the ELO rating system to better account for team strength differences when calculating rating changes:

**Completed Tasks:**

1. Analyzed the existing ELO rating system and identified limitations in team strength consideration
2. Implemented team strength adjustment factor in `eloCalculator.ts`:
   - Added calculation of team rating differences between opposing team and player's team
   - Applied a scaling factor (15% influence) to adjust the base rating change
   - Ensured the adjustment is proportional to the team rating difference
3. Created comprehensive documentation:
   - `elo-rating-system-updates.md`: Overview of changes and rationale
   - `elo-rating-system-diagram.md`: Visual representation of the calculation process
   - `elo-implementation-guide.md`: Technical implementation details
   - `rating-systems-comparison.md`: Comparison with other rating systems
4. Updated Memory Bank with the new ELO system design decisions

**Next Steps:**

1. Monitor the effects of the changes on player ratings in real games
2. Gather player feedback on whether the adjusted system feels more fair
3. Consider if additional role-specific adjustments would be beneficial
4. Evaluate if the scaling divisor (2000) and influence factor (15%) are appropriate

[2025-04-17 00:04:22] - **ELO Expected Score Calculation Adjustment Completed**

Modified the ELO expected score calculation to provide more realistic win probabilities:

**Completed Tasks:**

1. Analyzed user feedback indicating that win probabilities were unrealistic for large rating differences
2. Modified the `calculateExpectedScore` method in `eloCalculator.ts`:
   - Changed the divisor in the ELO formula from 400 to 800
   - This flattens the probability curve, giving more balanced expected outcomes
   - A player with a 1000 rating advantage now has ~70% expected win probability instead of ~95%
3. Updated all documentation to reflect this change:
   - Added win probability comparison chart to `elo-rating-system-diagram.md`
   - Updated `elo-rating-system-updates.md` with the new formula
   - Updated `elo-implementation-guide.md` with implementation details
   - Updated `rating-systems-comparison.md` with comparison to standard ELO
4. Updated Memory Bank with the new design decision

**Next Steps:**

1. Monitor the effects of the adjusted formula on rating changes
2. Gather player feedback on whether the new win probabilities feel more realistic
3. Consider if the divisor (800) needs further adjustment based on real game data
4. Analyze how the combination of both enhancements affects overall rating distribution

## Completed Tasks

- Enhanced ELO rating system with team strength adjustment
- Created comprehensive documentation for the ELO system changes
- Updated Memory Bank with the new design decisions
- Implemented the changes in `eloCalculator.ts`

## Current Tasks

- Monitor the effects of the changes on player ratings
- Gather player feedback on the adjusted system
- Consider if additional role-specific adjustments would be beneficial

## Next Steps

- Evaluate if the scaling divisor (2000) and influence factor (15%) are appropriate
- Consider UI improvements to better explain rating changes to players
- Explore potential future enhancements like dynamic K-factors or role-based adjustments

[2025-04-21 12:43:56] - **TrueSkill API Method Refactoring Completed**

Refactored the TrueSkill API to use a more efficient method for retrieving match-specific rating changes:

**Completed Tasks:**

1. Added new `getMatchTrueSkillChanges` method to the TrueSkill socket events interface in `trueskill-sockets.ts`
2. Implemented the backend endpoint in `trueSkillRatingEndpoints.ts` to retrieve TrueSkill changes by game ID
3. Updated `UserStats.vue` to use the new method for each game in the last games list
4. Removed console.log statements that were used for debugging
5. Updated Memory Bank with the new design decision

**Technical Details:**

- The previous implementation required fetching all player games and then filtering by game ID
- The new implementation makes one API call per game, retrieving only the necessary data
- This approach is more efficient and follows better API design principles

**Next Steps:**

1. Monitor the performance improvements from this change
2. Consider applying similar optimizations to other API endpoints
3. Evaluate if additional TrueSkill-related UI improvements would be beneficial
