# Adding New Plot Cards to Avalon

This guide provides step-by-step instructions for adding new plot cards to the Avalon game. Plot cards are special cards that can be used by players to influence the game in various ways.

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
    const owner = this.game.players.find((player) => player.features.yourCardNameCard === 'active');

    if (use && owner) {
      // Create history entry
      const cardHistory = new YourCardHistory(owner);
      this.game.history.push(cardHistory);

      // Implement card effect
      // ...

      // Remove card from game
      this.plotCardsAddon.removeCardFromGame(this);
      this.yourCardSubject.next(false);
    } else {
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

## Step 7: Add Player Features

Update the `PlotCardsFeatures` class in `packages/types/game/addons/index.ts` to add a feature for your card:

```typescript
export class PlotCardsFeatures {
  // Other features...

  /**
   * Your card description
   */
  @prop()
  yourCardNameCard?: 'has' | 'active';
}
```

## Step 8: Add Card to the Plot Cards Addon

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
  this.game.selectAvailable.yourCardName = (player) => player.features.yourCardNameCard === 'active';

  return of(true);
}
```

## Step 9: Add API Support

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

    case 'useYourCardName': {
      if (!this.game.addons.plotCards) {
        throw new Error('You cant use your card in game without plot cards addon');
      }

      const activeCard = this.game.addons.plotCards.activeCard;

      if (!activeCard) {
        throw new Error('No active card');
      }

      if (isYourCardNameCard(activeCard)) {
        activeCard.yourCardMethod(params.use);
        break;
      }

      throw new Error(`Active card ${activeCard.name} is not your card`);
    }
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

## Step 10: Add Frontend Support

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

### 3. Add UI components for your card in `packages/ui/src/components/view/board/game/modules/PlotCardsPanel.vue`:

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

    const isUserYourCardNameOwner = computed(() => {
      return Boolean(player.value?.features.yourCardNameCard === 'active');
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

## Step 11: Test Your Card

1. Start the game and make sure your card is included in the deck
2. Test the card's functionality to ensure it works as expected
3. Check that the history entries are correctly recorded and displayed
4. Verify that the UI components are displayed correctly

## Conclusion

Adding a new plot card to Avalon involves multiple steps across different parts of the codebase. By following this guide, you can ensure that your card is properly integrated into the game's systems and works correctly.

Remember to test your card thoroughly to ensure it doesn't introduce any bugs or unintended behavior.
