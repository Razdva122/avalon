# Memory Bank: Avalon Game Logic

This document contains information about the game logic and mechanics of the Avalon project.

## General Game Information

Avalon is a social deduction game where players are divided into two teams: Good (Loyal Servants of Arthur) and Evil (Minions of Mordred). The goal of Good is to successfully complete three missions, while the goal of Evil is to fail three missions or remain undetected.

## Key Game Logic Components

### Game Class

The main game class is located in `/packages/backend/src/core/game/index.ts`. It manages:

- Game state and stage transitions
- Player roles and visibility
- Mission execution and voting
- Team selection and leadership
- Addon integration through hooks
- Game history

Key properties of the Game class:

- `players`: Array of players participating in the game
- `missions`: Array of mission states
- `vote`: Current vote state
- `round`: Current mission round (0-4)
- `turn`: Current turn within a round
- `stage`: Current game stage
- `addons`: Enabled game addons
- `settings`: Game settings based on player count
- `history`: Complete game history

### GameManager

The GameManager class (`/packages/backend/src/core/game-manager/index.ts`) manages all active games:

- Creating new games
- Accessing existing games
- Processing game methods
- Ending games

The `callGameMethods` function in GameManager processes all game actions from players:

- It uses a switch statement to route different method types to appropriate handlers
- Helper methods are used to reduce code duplication:
  - `ensureAddonExists`: Validates that a required addon is available
  - `getActivePlotCard`: Retrieves and validates the active plot card
  - `handlePlotCardAction`: Processes plot card actions with type checking
  - `handleLoyaltyAction`: Handles loyalty-related actions for different addons

Methods are organized by categories:

- Core game methods (voting, player selection)
- Addon-specific methods (assassinate, excalibur)
- Loyalty-related methods (checking and announcing loyalty)
- Plot card methods (various card actions)

### Game Stages

The game progresses through several stages:

1. **Initialization** (`initialization`): Initial setup, role distribution
2. **Team Selection** (`selectTeam`): Leader selects a team for the mission
3. **Team Vote** (`votingForTeam`): All players vote on the proposed team
4. **Mission** (`onMission`): Selected team performs the mission
5. **End** (`end`): Game conclusion
6. **Addon-specific stages**: Various stages added by addons (e.g., `assassinate`, `ladyOfLake`, etc.)

### Game Flow

1. Game starts with role distribution and leader selection
2. For each round (0-4):
   - Leader selects a team for the mission
   - All players vote to approve/reject the team
   - If rejected, leadership passes to the next player (after 5 rejections, Evil wins)
   - If approved, selected team members vote on mission success/failure
   - Mission result is recorded (success/failure)
   - If 3 missions succeed, Good wins (unless Assassin kills Merlin)
   - If 3 missions fail, Evil wins
3. Addon-specific actions may occur between rounds

## Roles

Roles define the abilities and information available to players. The game supports a wide range of roles:

### Good Roles

- **Servant** (`servant`): Basic good role with no special abilities
- **Merlin** (`merlin`): Knows all evil players (except Mordred) but must remain hidden
- **Percival** (`percival`): Knows who Merlin is (and possibly Morgana)
- **Merlin Pure** (`merlinPure`): Variant of Merlin
- **Tristan** (`tristan`): Paired with Isolde, they know each other
- **Isolde** (`isolde`): Paired with Tristan, they know each other
- **Good Lancelot** (`goodLancelot`): Can switch sides during the game
- **Guinevere** (`guinevere`): Special role with unique abilities
- **Troublemaker** (`troublemaker`): Special good role
- **Cleric** (`cleric`): Special role with unique abilities

### Evil Roles

- **Minion** (`minion`): Basic evil role, knows other evil players
- **Morgana** (`morgana`): Appears as Merlin to Percival
- **Mordred** (`mordred`): Invisible to Merlin
- **Oberon** (`oberon`): Doesn't know other evil players, and they don't know him
- **Evil Lancelot** (`evilLancelot`): Can switch sides during the game
- **Trickster** (`trickster`): Special evil role
- **Lunatic** (`lunatic`): Special evil role
- **Brute** (`brute`): Special evil role
- **Witch** (`witch`): Special role with unique abilities
- **Revealer** (`revealer`): Special role with unique abilities

### Role Visibility

The game implements a sophisticated visibility system that determines what information each player can see about others:

- Each role has a `visibility` property that defines which other roles it can identify
- The `visibleRolesState` property in the Game class tracks what each player can see
- Some roles see other players' actual roles, some see only their loyalty, and some see nothing

## Missions

Missions are a key element of the gameplay:

- Each game consists of 5 missions
- 3 successful missions are needed for Good to win
- 3 failed missions result in Evil winning
- The number of players in a mission depends on the total number of players and the mission number
- Most missions require only one "fail" vote to fail, but some require two (especially in larger games)

Mission settings by player count:

```
5 players: [2,3,2,3,3] players per mission
6 players: [2,3,4,3,4] players per mission
7 players: [2,3,3,4,4] players per mission (4th mission requires 2 fails)
8-10 players: [3,4,4,5,5] players per mission (4th mission requires 2 fails)
```

## Voting System

There are two types of voting in the game:

1. **Team Vote**: All players vote to approve or reject the proposed team

   - If the majority votes "approve", the team goes on the mission
   - If the majority votes "reject", leadership passes to the next player
   - After 5 consecutive team rejections, Evil automatically wins

2. **Mission Vote**: Team members vote for the success or failure of the mission
   - Good players can only vote for success
   - Evil players can vote for either success or failure
   - Votes are shuffled to hide who voted how

## Addons (Game Extensions)

Addons extend the basic game mechanics through a hook system. The game supports various addons:

### Role-Dependent Addons

These addons are automatically enabled when specific roles are in the game:

- **Assassin**: Enabled when Merlin, MerlinPure, Tristan/Isolde, Guinevere, or Cleric are in play

  - Allows an evil player to attempt to kill a specific good role at the end of the game
  - If successful, Evil wins regardless of mission outcomes

- **Lancelots**: Enabled when Good Lancelot is in play

  - Allows Lancelots to switch sides during the game

- **Witch**: Enabled when the Witch role is in play

  - Provides special abilities to the Witch

- **Revealer**: Enabled when the Revealer role is in play

  - Provides special abilities to the Revealer

- **Cleric**: Enabled when the Cleric role is in play
  - Provides special abilities to the Cleric

### Independent Addons

These addons can be enabled regardless of the roles in play:

- **Lady of the Lake**: Allows players to check the loyalty of other players

  - Passes from player to player after each mission
  - Implementation: `/packages/backend/src/core/game/addons/lady-of-lake/index.ts`

- **Lady of the Sea**: Similar to Lady of the Lake with different mechanics

  - Implementation: `/packages/backend/src/core/game/addons/lady-of-sea/index.ts`

- **Excalibur**: A special sword that provides additional abilities

  - Can be used to change the result of a mission
  - Implementation: `/packages/backend/src/core/game/addons/excalibur/index.ts`

- **Plot Cards**: Adds special cards with unique effects
  - Cards include: Charge, Restore Honor, Show Strength, Show Nature, Are You The One, Lead to Victory, Ambush, King Returns, We Found You
  - Cards can affect voting, team composition, and other aspects of the game
  - Implementation: `/packages/backend/src/core/game/addons/plot-cards/index.ts`
  - For detailed instructions on adding new plot cards, see [Adding Plot Cards](adding-plot-cards.md)

## Hook System

The game uses a sophisticated hook system to allow addons to modify game behavior:

- Hooks are defined in `/packages/backend/src/core/game/hooks/index.ts`
- Each hook has three priority levels: `low`, `medium`, and `high`
- Addons can register methods to be called at specific points in the game flow
- Hook types include:
  - `afterInit`: Called after game initialization
  - `beforeSelectTeam`: Called before team selection phase
  - `afterSelectTeam`: Called after team selection
  - `beforeSentTeam`: Called before team is sent on mission
  - `afterSentTeam`: Called after team is sent
  - `beforeVoteForTeam`: Called before team vote
  - `afterVoteForTeam`: Called after team vote
  - `beforeStartMission`: Called before mission starts
  - `afterStartMission`: Called after mission starts
  - `beforeEndMission`: Called before mission ends
  - `afterEndMission`: Called after mission ends
  - `beforeEndGame`: Called before game ends

## Game History

The game history system records all events that occur during the game:

- Each action is saved in the history with a timestamp
- History includes missions, votes, and addon-specific events
- History types include:
  - `mission`: Mission results
  - `vote`: Team vote results
  - `assassinate`: Assassination attempts
  - `checkLoyalty`: Loyalty checks (Lady of Lake, etc.)
  - `switchResult`: Result changes (Excalibur, etc.)
  - `hiddenHistory`: Hidden events
  - `switchLancelots`: Lancelot side switches
  - `giveCard`: Plot card distributions
  - `preVote`: Pre-voting events
  - `leadToVictory`: Leadership changes

## Frontend Interaction

Game logic interacts with the frontend through Socket.io:

1. Frontend sends commands through sockets
2. Backend processes commands and updates game state
3. Backend sends updated state to all players
4. Frontend displays the current game state

Main socket events are defined in `/packages/types/api/sockets.ts`.

## Game Settings

Game settings are determined by the number of players:

- Player counts from 5 to 10 are supported
- Each player count has specific settings for:
  - Number of good and evil players
  - Number of players required for each mission
  - Number of fails required to fail each mission

## Recommendations for Working with Game Logic

1. Use the hook system to extend game functionality
2. Follow the existing patterns for adding new roles and addons
3. Ensure proper role visibility when adding new roles
4. Update game history for all significant events
5. Use types from the `types` package for type safety
6. Test new functionality thoroughly to ensure game balance
7. When adding new plot cards, follow the detailed guide in [Adding Plot Cards](adding-plot-cards.md)
