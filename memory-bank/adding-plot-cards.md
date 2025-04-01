# Adding New Plot Cards to Avalon - Updated Guide

This guide provides updated instructions for adding new plot cards to the Avalon game, reflecting the new implementation that uses `addonsData.cardsInGame` instead of `player.features`.

## Types of Plot Cards

There are three types of plot cards in the game:

- **Usable**: Cards that players can choose to use or skip at specific moments
- **Instant**: Cards that are activated immediately when given to a player
- **Effect**: Cards that have a passive effect throughout the game

## Step 1: Define the Card Type and Behavior

First, decide what type of card you want to create and how it should behave:

- What is the card's purpose?
- When can it be used?
- What effect does it have on the game?
- Is it a usable, instant, or effect card?

## Step 2: Update Type Definitions

### 1. Add the card name to the appropriate type in `packages/types/game/addons/plot-cards.ts`:

```typescript
// For a usable card:
export type TUsableCardNames = 'leadToVictory' | 'ambush' | 'kingReturns' | 'yourNewCardName';

// For an instant card:
export type TInstantCardNames = 'restoreHonor' | 'showStrength' | 'showNature' | 'areYouTheOne' | 'yourNewCardName';

// For an effect card:
export type TEffectsCardNames = 'charge' | 'yourNewCardName';
```

### 2. If your card introduces a new game stage, add it to `TPlotCardsStages`:

```typescript
export type TPlotCardsStages =
  | 'giveCard'
  | 'preVote'
  | 'leadToVictory'
  | 'restoreHonor'
  | 'ambush'
  | 'kingReturns'
  | 'yourNewCardStage';
```

## Step 3: Create the Card Class

Create a new file for your card in one of these directories, depending on the card type:

- `packages/backend/src/core/game/addons/plot-cards/cards/usable/`
- `packages/backend/src/core/game/addons/plot-cards/cards/instant/`
- `packages/backend/src/core/game/addons/plot-cards/cards/effect/`

### Example for a Usable Card:

```typescript
import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';
import { Subject } from 'rxjs';
import { YourCardHistory } from '@/core/game/addons/plot-cards/history';

export class YourCardNameCard extends AbstractCard implements IUsablePlotCard {
  name = <const>'yourCardName';
  type = <const>'usable';
  yourCardSubject: Subject<boolean> = new Subject();

  play(ownerID: string) {
    this.activateCard(ownerID);
    this.game.stage = 'yourCardStage';
    this.game.stateObserver.gameStateChanged();
    return this.yourCardSubject.asObservable();
  }

  yourCardMethod(use: boolean) {
    // Find the player who owns the card
    const owner = this.game.findPlayerByID(this.ownerID!);
    owner.features.waitForAction = false;

    if (use) {
      // Create history entry
      const cardHistory = new YourCardHistory(owner);
      this.game.history.push(cardHistory);

      // Implement card effect
      // ...

      // Remove card from game
      this.plotCardsAddon.removeCardFromGame(this);
      this.yourCardSubject.next(false);
    } else {
      // If not used, set stage back to 'has'
      this.stage = 'has';
      this.yourCardSubject.next(true);
    }
  }
}
```

## Step 4: Create History Class for the Card

### 1. Create a history class file in `packages/backend/src/core/game/addons/plot-cards/history/yourCardName.ts`:

```typescript
import { HistoryElement, THistoryData } from '@/core/game/history';
import { THistoryStage } from '@avalon/types';
import { IPlayerInGame } from '@/core/game/interface';

export class YourCardHistory implements HistoryElement<'yourCardName'> {
  type = <const>'yourCardName';
  stage: THistoryStage;
  canBeHidden = false;
  data: THistoryData['yourCardName'];

  constructor(owner: IPlayerInGame) {
    this.data = {
      owner: owner,
      // Add any other data needed for history
    };

    this.stage = 'finished';
  }

  dataForManager() {
    const ownerID = this.data.owner.user.id;

    return {
      type: this.type,
      ownerID,
      // Add any other data needed for frontend
    };
  }
}
```

### 2. Export the history class in `packages/backend/src/core/game/addons/plot-cards/history/index.ts`:

```typescript
export * from '@/core/game/addons/plot-cards/history/yourCardName';
```

## Step 5: Update History Type Definitions

### 1. Update `THistoryType` in `packages/types/game/history.ts`:

```typescript
export type THistoryType =
  | 'mission'
  | 'vote'
  | 'assassinate'
  | 'checkLoyalty'
  | 'switchResult'
  | 'switchLancelots'
  | 'giveCard'
  | 'preVote'
  | 'leadToVictory'
  | 'restoreHonor'
  | 'ambush'
  | 'kingReturns'
  | 'yourCardName';
```

### 2. Add the card to `THistoryResults`:

```typescript
export type THistoryResults =
  | AnonymousHistoryVote
  | HistoryVote
  | HistoryMission
  | HistoryMissionHidden
  | HistoryAssassinate
  | CheckLoyalty
  | SwitchResult
  | HiddenHistory
  | SwitchLancelots
  | HiddenHistory
  | GiveCard
  | PreVote
  | LeadToVictory
  | RestoreHonor
  | Ambush
  | KingReturns
  | YourCardHistory;
```

### 3. Create the history class in `packages/types/game/history.ts`:

```typescript
export class YourCardHistory extends HistoryBase {
  declare type: 'yourCardName';

  @prop({ required: true })
  public ownerID!: string;

  // Add any other properties needed
}
```

### 4. Import the class in `packages/types/game/state.ts` and add it to the discriminators:

```typescript
import {
  // Other imports...
  YourCardHistory,
} from './history';

// ...

@prop({
  _id: false,
  type: () => [HistoryBase],
  discriminators: () => [
    // Other discriminators...
    { type: YourCardHistory, value: 'yourCardName' },
  ],
})
```

## Step 6: Update History Data Interfaces

Update the `THistoryData` and `THistoryDataForManager` interfaces in `packages/backend/src/core/game/history/interface.ts`:

```typescript
// Import your history class
import type {
  // Other imports...
  YourCardHistory,
} from '@avalon/types';

export type THistoryData = {
  // Other history data...
  yourCardName: {
    owner: IPlayerInGame;
    result?: undefined;
    // Add any other data needed
  };
  // ...
};

export type THistoryDataForManager = {
  // Other history data...
  yourCardName: YourCardHistory;
  // ...
};
```

## Step 7: Add Card to the Plot Cards Addon

Update the `PlotCardsAddon` constructor in `packages/backend/src/core/game/addons/plot-cards/index.ts` to include your card:

```typescript
import {
  // Other imports...
  YourCardNameCard,
} from '@/core/game/addons/plot-cards/cards';

// ...

constructor(game: Game) {
  this.game = game;

  const cards: Array<new (game: Game, addon: this) => TPlotCard> = [
    // Other cards...
    YourCardNameCard,
  ];

  // ...
}
```

If needed, add a selectAvailable handler for your card:

```typescript
afterInit() {
  // Other handlers...
  this.game.selectAvailable.yourCardName = isCardActive('yourCardName');

  return of(true);
}
```

## Step 8: Add API Support

### 1. Add a method to the `ClientToServerEvents` interface in `packages/types/api/sockets.ts`:

```typescript
export interface ClientToServerEvents extends ClientToServerUserEvents {
  // Other methods...
  useYourCardName: (uuid: string, use: boolean) => void;
}
```

### 2. Add a parameter type to `packages/backend/src/core/game-manager/interface.ts`:

```typescript
export type TUseYourCardNameParams = {
  method: 'useYourCardName';
  use: boolean;
};

export type TGameMethodsParams =
  | TSelectPlayerParams
  | TVoteParams
  // Other params...
  | TUseYourCardNameParams;
```

### 3. Add a case to the `callGameMethods` method in `packages/backend/src/core/game-manager/index.ts`:

```typescript
callGameMethods(userID: string, params: TGameMethodsParams): void {
  switch (params.method) {
    // Other cases...

    case 'useYourCardName':
      this.handlePlotCardAction(
        'your card',
        isYourCardNameCard,
        (card) => card.yourCardMethod(params.use)
      );
      break;
  }
}
```

### 4. Add a type guard in `packages/backend/src/core/game/addons/plot-cards/helpers.ts`:

```typescript
export function isYourCardNameCard(card: TPlotCard): card is YourCardNameCard {
  return card.name === 'yourCardName' && card instanceof YourCardNameCard;
}
```

### 5. Add a socket handler in `packages/backend/src/main/index.ts`:

```typescript
socket.on('useYourCardName', (uuid, use) => {
  console.log(`Player ${userName} useYourCardName (used: ${use}) in game ${uuid}`);
  getRoomManager(uuid).callGameMethods(userID, { method: 'useYourCardName', use });
});
```

## Step 9: Add Frontend Support

### 1. Add a translation for your card in `packages/ui/src/i18n/langs/en.ts`:

```typescript
cardsInfo: {
  // Other cards...
  yourCardName: 'Your Card Name',
  yourCardNameHint: 'Description of what your card does',
},

// Add history translation if needed
yourCardName: {
  history: '<b>{cardOwner}</b> used the card «{cardName}» to do something',
},
```

### 2. Add the card stage to the `stageText` object in `packages/ui/src/components/view/board/game/Game.vue`:

```typescript
const stageText = computed(() => {
  return {
    // Other stages...
    yourCardStage: 'your card stage',
  }[gameState.value.stage];
});
```

### 3. Create a history view component in `packages/ui/src/components/view/information/history/YourCardName.vue`:

```vue
<template>
  <div>
    <span
      v-html="
        $t('yourCardName.history', {
          cardName: $t('cardsInfo.yourCardName'),
          cardOwner: calculateNameByID(data.ownerID),
        })
      "
    >
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { YourCardHistory } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<YourCardHistory>,
    },
    calculateNameByID: {
      required: true,
      type: Function as PropType<TCalculateNameByID>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
```

### 4. Register the history component in `packages/ui/src/components/view/information/History.vue`:

```typescript
// Import the component
import YourCardName from '@/components/view/information/history/YourCardName.vue';

// Add it to the components section
components: {
  // Other components...
  YourCardName,
},
```

### 5. Add UI components for your card in `packages/ui/src/components/view/board/game/modules/PlotCardsPanel.vue`:

```vue
<template>
  <!-- Other templates... -->

  <template v-if="game.stage === 'yourCardStage'">
    <template v-if="isUserYourCardNameOwner">
      <v-btn color="success" @click="() => yourCardNameClick(true)" class="mb-2">
        {{ $t('inGame.useCard', { cardName: $t('cardsInfo.yourCardName') }) }}
      </v-btn>
      <v-btn color="warning" @click="() => yourCardNameClick(false)">
        {{ $t('inGame.skipCard', { cardName: $t('cardsInfo.yourCardName') }) }}
      </v-btn>
    </template>
    <template v-else>
      <PlotCard
        :display-tooltip="true"
        class="plot-card plot-card-selectionInProgress"
        card-name="yourCardName"
      ></PlotCard>
    </template>
  </template>
</template>

<script lang="ts">
// ...

export default defineComponent({
  // ...

  setup(props) {
    // ...

    // Use the new method to check if the player has the card
    const isUserYourCardNameOwner = computed(() => {
      const playerID = player.value?.id;
      return Boolean(
        game.value.addonsData?.plotCards?.cardsInGame?.some(
          (card) => card.name === 'yourCardName' && card.ownerID === playerID && card.stage === 'active',
        ),
      );
    });

    const yourCardNameClick = (use: boolean) => {
      socket.emit('useYourCardName', game.value.uuid, use);
    };

    return {
      // Other returns...
      isUserYourCardNameOwner,
      yourCardNameClick,
    };
  },
});
</script>
```

## Step 10: Testing Your Card

1. Test the card distribution during the game
2. Test the card activation and usage
3. Verify that the history is correctly recorded
4. Check that the UI correctly displays the card state
5. Test edge cases and interactions with other cards

## Helper Functions for Frontend Components

To simplify card checks in frontend components, you can create these helper functions:

```typescript
// Check if a player has a card (any stage)
const hasCard = (playerID, cardName) => {
  return Boolean(
    game.value.addonsData?.plotCards?.cardsInGame?.some((card) => card.name === cardName && card.ownerID === playerID),
  );
};

// Check if a player has an active card
const hasActiveCard = (playerID, cardName) => {
  return Boolean(
    game.value.addonsData?.plotCards?.cardsInGame?.some(
      (card) => card.name === cardName && card.ownerID === playerID && card.stage === 'active',
    ),
  );
};

// Get all cards owned by a player
const getPlayerCards = (playerID) => {
  if (!playerID || !game.value.addonsData?.plotCards?.cardsInGame) return [];

  return game.value.addonsData.plotCards.cardsInGame
    .filter((card) => card.ownerID === playerID)
    .map((card) => ({ name: card.name, stage: card.stage }));
};
```
