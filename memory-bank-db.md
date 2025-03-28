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
7. Follow the single responsibility principle when creating database queries
