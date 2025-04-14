# Plot Cards Update: CardID Requirement

## Overview

As of the latest update, when using plot cards in the game, the card's unique `id` must be sent along with the action to identify the specific card instance.

## Implementation Details

Each plot card has a unique `id` property (defined in `IBasePlotCard` interface in `packages/backend/src/core/game/addons/plot-cards/interface.ts`). This ID must now be included when sending socket events to use a card.

### Frontend Implementation

In the frontend, the card ID is retrieved using the `getActiveCardByType` function and passed as an additional parameter to the socket events:

```typescript
// Example from PlotCardsPanel.vue
const leadToVictoryClick = (use: boolean) => {
  const card = getActiveCardByType('leadToVictory');
  socket.emit('useLeadToVictory', game.value.uuid, use, card.id);
};

const kingReturnsClick = (use: boolean) => {
  const card = getActiveCardByType('kingReturns');
  socket.emit('useKingReturns', game.value.uuid, use, card.id);
};

const weFoundYouClick = () => {
  const card = getActiveCardByType('weFoundYou');
  socket.emit('useWeFoundYou', game.value.uuid, isZeroPlayerSelected.value ? false : true, card.id);
};

// For ambush card
const emitClick = (methodName: TMethodName) => {
  if (methodName === 'useAmbush') {
    const card = getActiveCardByType('ambush');
    socket.emit(methodName, game.value.uuid, card.id);
  }
};
```

### Backend Processing

The backend now expects the cardID parameter in the socket events and uses it to identify the specific card instance to be used.

## Developer Guidelines

When implementing new plot cards or modifying existing ones:

1. Always include the card's `id` when sending socket events to use a card
2. Use the `getActiveCardByType` helper function to retrieve the card with its ID
3. Update socket event handlers to expect and process the cardID parameter
4. Test thoroughly to ensure the correct card instance is being used

## Related Files

- `packages/backend/src/core/game/addons/plot-cards/interface.ts` - Defines the card interface with the `id` property
- `packages/ui/src/components/view/board/game/modules/PlotCardsPanel.vue` - Frontend implementation of card usage
- `packages/backend/src/core/game-manager/index.ts` - Backend processing of card actions
