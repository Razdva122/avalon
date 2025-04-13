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

- Adapting the UserHoverCard component for mobile devices where hover interactions are not available
- Implementing a long press gesture using @vueuse/core to trigger the UserHoverCard on mobile
- Ensuring the existing click functionality for player selection remains intact
- Providing visual feedback for long press interactions on mobile devices

## Recent Changes

- Created detailed implementation plan for mobile adaptation of UserHoverCard
- Evaluated multiple approaches: custom directive, @vueuse/core, and Vuetify components
- Selected @vueuse/core solution for its balance of simplicity and functionality
- Documented mobile adaptation patterns in systemPatterns.md for future reference

## Open Questions/Issues

- Test the long press implementation on various mobile devices to ensure consistent behavior
- Consider if the 600ms delay for long press is appropriate for the user experience
- Evaluate if additional visual feedback is needed during the long press interaction
- Determine if any performance optimizations are needed for the modal dialog on lower-end devices
