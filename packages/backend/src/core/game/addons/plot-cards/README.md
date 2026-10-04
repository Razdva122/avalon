# Plot Cards Addon

## Overview

Plot Cards are special game-changing cards that can be used during different stages of the Avalon game to modify gameplay dynamics.

## Card Distribution by Player Count

### 5+ Player Cards

- **Lead To Victory (Strong leader)** - 2x
  - Become a leader (playable before team selection)
- **Ambush (Keeping a close eye on you)** - 2x
  - Check 1 mission card
- **The King Returns (No Confidence)** - 1x
  - Null a previous approve and change leadership
- **Restore Your Honor (Take Responsibility)** - 1x
  - Take plot card from any player
- **Charge (Opinion Maker)** - 1x
  - Player must vote publicly

### Additional cards at 7–10 players

- **The King Returns (No Confidence)** - 2x
  - Null a previous approve and change leadership
- **Charge (Opinion Maker)** - 1x
  - Player must vote publicly
- **Show Your True Nature (Open Up)** - 1x
  - Reveal your loyalty to any player
- **Are You the One (Overheard Conversation)** - 2x
  - Check loyalty of player right or left
- **We Found You (In the Spotlight)** - 1x
  - 1 player play mission card visible
- **Show Your Strength (Establish Confidence)** - 1x
  - Leader reveal his loyalty to any player

## Card Types

- **Instant**: Cards that have an immediate, one-time effect
- **Usable**: Cards that can be played at specific game stages
- **Effect**: Cards stay in the game until the end

## Deck and distribution

The seven base cards above form the complete deck for 5–6 players. At 7–10 players
the eight additional cards are added to that deck (15 total); their counts are
additional, so The King Returns has three copies and Charge has two.
The shuffled deck distributes one card per round at 5–6 players, two at 7–8,
and three at 9–10. Card distribution starts at the first team-selection attempt
of a mission. The leader assigns each card to a player.

Implementation: `index.ts` defines the deck and stage hooks, `cards` implements
effects, `history` records actions, and `interface.ts` defines runtime card state.
Shared names/history contracts are in `packages/types/game`.

[Documentation index](../../../../../../../docs/README.md) ·
Public addon rules are available in the in-game wiki.
