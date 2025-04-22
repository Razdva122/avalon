# Active Context

[2025-04-13 15:17:16] - Completed refactoring of the plot cards system to use an array of active cards (`activeCards`) instead of a single active card (`activeCard`), and added support for passing card IDs from the frontend to the backend to identify which specific card is being used. The changes include:

1. Updated interfaces in `game-manager/interface.ts` to include optional `cardID` parameters
2. Modified methods in `game-manager/index.ts` to find specific cards in the `activeCards` array
3. Updated socket handlers in `main.ts` to accept and pass the `cardID` parameter
4. Updated socket type definitions in `sockets.ts` to include the `cardID` parameter
5. Updated the `makeVote` method in `ChargeCard` class to accept and use the `cardID` parameter
6. Updated test helpers to work with the new system

[2025-04-13 15:22:27] - Completed the frontend updates to pass card IDs when calling plot card-related methods:

[2025-04-13 15:25:01] - Added dedicated methods with required cardID parameters:

1. Added new socket methods in `sockets.ts`:

   - `checkLoyaltyWithCard` - Requires a cardID parameter
   - `revealLoyaltyWithCard` - Requires a cardID parameter

2. Updated socket handlers in `main.ts` to handle these new methods

3. Updated `LoyaltyCardActions.vue` to use the new methods when a card ID is available:
   - Uses `checkLoyaltyWithCard` instead of `checkLoyalty` when a card ID is available
   - Uses `revealLoyaltyWithCard` instead of `revealLoyalty` when a card ID is available

This approach provides better type safety by making the cardID parameter required in the dedicated methods while maintaining backward compatibility with the original methods.

[2025-04-13 15:32:00] - Made cardID a required parameter in all plot card-related methods:

1. Updated socket type definitions in `sockets.ts` to make cardID a required parameter:

   - Changed `preVote`, `useLeadToVictory`, `useAmbush`, `useKingReturns`, and `useWeFoundYou` to require cardID

2. Updated interface definitions in `game-manager/interface.ts` to make cardID a required parameter:

   - Changed `TPreVoteParams`, `TUseLeadToVictoryParams`, `TUseAmbushParams`, `TUseKingReturnsParams`, and `TUseWeFoundYouParams` to require cardID

3. Updated socket handlers in `main.ts` to expect required cardID parameters

4. Removed unnecessary cardID null checks in `game-manager/index.ts` since cardID is now required

5. Updated frontend components to always provide a valid cardID:
   - Added error handling in `PlotCardsPanel.vue` to prevent sending requests without a valid cardID
   - Updated `LoyaltyCardActions.vue` to only use the WithCard methods and require a valid cardID
   - Updated `AnnounceLoyalty.vue` to require a valid cardID

This approach ensures type safety by making cardID a required parameter throughout the system, eliminating the need for null checks on the backend.

1. Updated `LoyaltyCardActions.vue` to pass the active card ID when calling `checkLoyalty` and `revealLoyalty` methods
2. Updated `AnnounceLoyalty.vue` to use `getLoyaltyWithCard` when an active card ID is available and to pass the card ID when calling `announceLoyalty`
3. Updated `PlotCardsPanel.vue` to:
   - Add a `getActiveCardByType` helper method to find active cards by type
   - Update `leadToVictoryClick`, `kingReturnsClick`, and `weFoundYouClick` methods to pass the card ID
   - Update `emitClick` method to pass the card ID for the `useAmbush` method

The system now fully supports having multiple active cards of the same type simultaneously, with the frontend correctly identifying and passing the specific card ID to the backend.

This file tracks the project's current status, including recent changes, current goals, and open questions.
2025-04-13 00:04:12 - Log of updates made.

-

## Current Focus

- Enhancing the ELO rating system to better account for team dynamics
- Adjusting expected win probabilities to be more realistic for games with large rating differences
- Implementing team strength adjustment factor to make rating changes more fair
- Creating comprehensive documentation for the ELO system changes
- Monitoring the effects of the changes on player ratings

## Recent Changes

- Modified the expected score calculation in `eloCalculator.ts` to use a divisor of 800 instead of 400
- Enhanced the ELO rating calculation to include team strength factor
- Added team rating difference calculation to adjust rating changes based on team composition
- Created detailed documentation including diagrams and implementation guides
- Updated Memory Bank with the new ELO system design decisions
- Refactored TrueSkill API to use `getMatchTrueSkillChanges` instead of `getPlayerTrueSkillChanges`

## Open Questions/Issues

- Monitor how the 15% influence factor affects rating changes in real games
- Gather player feedback on whether the adjusted system feels more fair
- Consider if additional role-specific adjustments would be beneficial
- Evaluate if the scaling divisor (2000) is appropriate for the 0-10000 rating scale
- Determine if any additional UI changes are needed to better explain rating changes to players
- Evaluate performance improvements from the TrueSkill API refactoring
- Implement TrueSkill rating system as an alternative to the ELO system

[2025-04-22 19:39:43] - Implemented TrueSkill rating system to provide a more accurate skill measurement for players. The implementation includes:

1. Core TrueSkill calculation system in `trueSkillCalculator.ts` with:

   - Team normalization to handle different team sizes fairly
   - Skill adjustment factors that give higher/lower rating changes based on player performance relative to team
   - Conservative rating calculation (mu - 3\*sigma) for public display

2. Database models and migrations:

   - `PlayerTrueSkillRating` - Stores player TrueSkill ratings (mu, sigma, conservative rating)
   - `GameTrueSkillResult` - Stores rating changes for each game
   - `TrueSkillRatingHistory` - Stores historical snapshots for tracking progress

3. API endpoints in `trueSkillRatingEndpoints.ts`:

   - `getTrueSkillRating` - Get rating for a specific player
   - `getTrueSkillLeaderboard` - Get top players by TrueSkill rating
   - `getMatchTrueSkillChanges` - Get rating changes for a specific game

4. Frontend components:

   - `UserTrueSkillRating.vue` - Display player TrueSkill rating
   - Integration with user profile and hover cards
   - Internationalization support for TrueSkill-related UI elements

5. Constants and configuration:
   - Default mu (6000) and sigma (1500) values
   - Beta value (1200) for skill difference calculation
   - TAU value (35) for dynamic adaptation
   - Conservative rating factor (3) for public display

The TrueSkill system provides several advantages over the previous ELO system:

- Better handling of team games with different team sizes
- Uncertainty tracking through sigma parameter
- More accurate skill representation for new players
- Faster adaptation to skill changes
