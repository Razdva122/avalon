# Memory Bank: Avalon Database Structure

This document contains information about the database structure of the Avalon project.

## General Information

The Avalon project uses MongoDB with Typegoose for typed data access. Database interaction occurs through the `DBManager`, which encapsulates all database operations.

## Key Data Models

### Users (UserProfile)

Stores information about system users:

- `id`: unique user identifier
- `name`: username
- `avatar`: user avatar (default 'servant')
- `email`: user email (unique, converted to lowercase)
- `login`: user login (unique, converted to lowercase)
- `registrationDate`: registration date
- `password`: hashed password

### User Features (UserFeatures)

Stores additional user features and capabilities:

- `userID`: user identifier (unique)
- `isContributor`: whether the user is a contributor
- `isHelper`: whether the user is a helper
- `easterEggRevealed`: whether the user has discovered the easter egg

### Rooms (StartedRoomState)

Stores information about game rooms:

- `stage`: room stage ('created', 'locked', 'started')
- `roomID`: unique room identifier
- `leaderID`: room leader identifier
- `createAt`: room creation date
- `players`: list of players in the room
- `vote`: information about the current vote (if any)
- `options`: game settings
- `chat`: chat message history
- `startAt`: game start date (for StartedRoomState)
- `game`: game state (for StartedRoomState)

### Room Players (RoomPlayer)

Stores information about players in a room:

- `id`: user identifier
- `name`: username
- `isLeader`: whether the player is the room leader

### Chat Messages (ChatMessage)

Stores chat messages in a room:

- `userID`: identifier of the user who sent the message
- `message`: message text
- `timestamp`: message timestamp

### Votes (VoteInRoom)

Stores information about votes in a room:

- `target`: vote target ('endGame', 'endAndRestartGame')
- `votes`: list of player votes
- `result`: vote result

### Vote Results (VoteRoomResult)

Stores vote results:

- `total`: total number of votes
- `yes`: number of "yes" votes
- `no`: number of "no" votes
- `required`: required number of votes for decision making

## Database Interaction

### DBManager

The main class for working with the database is located in `/packages/backend/src/db/index.ts`. It provides methods for:

- Connecting to the database
- Executing queries
- Managing transactions
- Executing migrations

### Models

Data models are defined using Typegoose and are located in:

- `/packages/types/user/index.ts` - user models
- `/packages/types/room/index.ts` - room models
- `/packages/backend/src/db/models/index.ts` - model exports for use in the backend

```typescript
// Example from /packages/backend/src/db/models/index.ts
import { getModelForClass } from '@typegoose/typegoose';
import { UserProfile, StartedRoomState, UserFeatures } from '@avalon/types';

export const userProfileModel = getModelForClass(UserProfile);
export const roomModel = getModelForClass(StartedRoomState);
export const userFeaturesModel = getModelForClass(UserFeatures);
```

### Migrations

The migration system allows managing database schema changes:

- Migrations are located in `/packages/backend/src/db/migrations/`
- Each migration has `up()` and `down()` methods
- Migrations are executed automatically when the server starts

### Queries

Main database queries are encapsulated in separate files:

- `/packages/backend/src/db/query.ts` - general queries
- `/packages/backend/src/db/user.ts` - user-related queries

## Database Interaction Schema

1. Application components (Game, Room, User) use DBManager methods to work with data
2. DBManager executes queries to MongoDB through Typegoose models
3. Query results are converted to typed objects
4. Application components work with typed objects

## Database Recommendations

1. Always use DBManager for database interaction
2. Create new migrations for database schema changes
3. Use types from the `types` package for working with data
4. Handle database errors with try/catch
5. Use indexes for query optimization
6. When adding new fields to models, update corresponding types in the `types` package

## Rating System

The Avalon project includes a sophisticated rating system that tracks player performance with different roles.

### Rating Models

#### RoleRating

Stores ratings for each user and role combination:

- `userID`: user identifier
- `role`: game role (e.g., 'merlin', 'servant')
- `winrate`: percentage of games won with this role
- `gamesCount`: total number of games played with this role
- `rating`: calculated rating score
- `rank`: position in the leaderboard
- `lastPlayedAt`: date when the role was last played
- `updatedAt`: date when the rating was last updated

#### RoleRankings

Stores historical snapshots of all ratings:

- `date`: date of the snapshot
- `ratings`: array of RoleRating objects

### Rating Calculation

Ratings are calculated using the following algorithm:

1. **Base Rating**: Combines winrate (70% weight) and games count (30% weight)

   - Games count uses a logarithmic scale to prevent inflation
   - Formula: `baseRating = winrate * 0.7 + logFactor * 0.3 * 100`

2. **Time Decay**: Ratings decay over time if a player hasn't played recently

   - Quadratic decay formula: `1 - (days/MAX_DECAY_DAYS)^2 * MAX_DECAY`
   - Maximum decay is 20% after 60 days

3. **Minimum Games**: Players need at least 10 games with a role to have a rating

### Rating Updates

Ratings are updated automatically:

- A scheduler runs the update process daily at 1 AM
- The process analyzes all completed games
- Historical snapshots are stored for tracking rating changes over time

### API Endpoints

The following socket endpoints are available for accessing rating data:

- `getRoleLeaderboard`: Get top 20 players for a specific role
- `getUserRatings`: Get all ratings for a specific user
- `getRatingHistory`: Get rating history for a user and role over the last 30 days

7. Follow the single responsibility principle when creating database queries

## TrueSkill Rating System

The Avalon project has implemented a TrueSkill rating system alongside the existing ELO system to provide a more sophisticated approach to player skill measurement.

### TrueSkill Models

#### PlayerTrueSkillRating

Stores TrueSkill ratings for each player:

- `userID`: user identifier (unique)
- `mu`: mean skill value (default 6000)
- `sigma`: skill uncertainty (default 1500)
- `conservativeRating`: calculated as mu - 3\*sigma
- `gamesCount`: total number of games played
- `wins`: number of games won
- `losses`: number of games lost
- `lastPlayedAt`: date when the player last played
- `updatedAt`: date when the rating was last updated

#### GameTrueSkillResult

Stores TrueSkill rating changes for each game:

- `gameID`: unique game identifier
- `playedAt`: date when the game was played
- `playerChanges`: array of player rating changes

#### TrueSkillRatingHistory

Stores historical snapshots of TrueSkill ratings:

- `date`: date of the snapshot
- `ratings`: array of player ratings with ranks

### TrueSkill Calculation

TrueSkill ratings are calculated using the following approach:

1. **Team-Based Calculation**: Ratings are calculated based on team performance, with normalization to handle different team sizes.

2. **Skill and Uncertainty**: Each player has both a skill value (mu) and an uncertainty value (sigma).

   - Higher sigma means faster adaptation to new performance levels
   - Sigma decreases as more games are played, stabilizing the rating

3. **Conservative Rating**: Public display uses a conservative rating (mu - 3\*sigma) to ensure 99.7% confidence.

4. **Skill Adjustment Factors**:

   - Winners: Higher skilled players get smaller gains, lower skilled players get larger gains
   - Losers: Higher skilled players get larger penalties, lower skilled players get smaller penalties

5. **Minimum Games**: Players need at least 10 games to appear on the leaderboard.

### API Endpoints

The following socket endpoints are available for accessing TrueSkill data:

- `getTrueSkillRating`: Get TrueSkill rating for a specific player
- `getTrueSkillLeaderboard`: Get top players by TrueSkill rating
- `getMatchTrueSkillChanges`: Get rating changes for a specific game

### Rating Updates

TrueSkill ratings are updated:

- Immediately when a game ends via `updateTrueSkillForGame`
- Historical snapshots are created periodically via `createTrueSkillRatingSnapshot`
