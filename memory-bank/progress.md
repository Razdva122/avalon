# Progress

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

## Completed Tasks

- Analyzed existing components and data structures related to user profiles and statistics
- Created initial implementation of UserHoverCard component
- Added necessary translations to all language files
- Implemented delayed hover functionality (1-second delay)
- Identified issues with the current implementation (positioning, overlapping)
- Researched existing tooltip patterns in the project
- Created detailed plan for improving the component using v-tooltip

## Current Tasks

- Modify Player.vue to use v-tooltip instead of direct inclusion of UserHoverCard
- Simplify UserHoverCard.vue by removing positioning styles
- Remove manual timer handling in favor of v-tooltip's built-in delay options
- Test the implementation in different screen positions and scenarios

## Next Steps

- Implement the v-tooltip-based solution according to the detailed plan
- Test the implementation thoroughly
- Consider additional user information that might be valuable in the hover card
