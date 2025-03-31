# Memory Bank for Avalon Project

This document contains structured information about the Avalon project to facilitate future development.

## General Project Information

Avalon is a web implementation of the board game "Avalon: The Resistance," a multiplayer game with roles, missions, and hidden identities.

## Project Architecture

The project is organized as a monorepo with three main packages:

- `packages/backend` - server-side (Node.js, Express, Socket.io, MongoDB)
- `packages/ui` - client-side (Vue 3, Vuetify, Vuex)
- `packages/types` - shared types and interfaces for both parts of the application

### Backend

The backend is built on an architecture based on managers and classes:

- **Core** (`/packages/backend/src/core/`) - core game logic

  - Game - game process management
  - Roles - definition and behavior of game roles
  - Game Manager - management of game sessions

- **DB** (`/packages/backend/src/db/`) - interaction with MongoDB database

  - Models - data schemas
  - Migrations - database migrations
  - Queries - database queries

- **Room** (`/packages/backend/src/room/`) - room and chat logic

  - Room Manager - management of game rooms
  - Chat - chat system

- **User** (`/packages/backend/src/user/`) - user management

  - User Manager - management of user data
  - Avatars - avatar system

- **Helpers** (`/packages/backend/src/helpers/`) - helper functions

  - Event Bus - event system
  - Socket Helpers - helper functions for working with sockets

- **Main** (`/packages/backend/src/main/`) - main application manager
  - Initialization and coordination of all components

### Frontend

The frontend is built on Vue 3 using Composition API:

- **Components** (`/packages/ui/src/components/`) - reusable components

  - View - view components
  - Modals - modal windows
  - User - user-related components
  - Header - header components
  - Stats - statistics components

- **Pages** (`/packages/ui/src/pages/`) - application pages

  - Lobby - game lobby
  - Room - game room
  - Profile - user profile
  - Stats - statistics
  - Wiki - wiki pages with rules

- **Store** (`/packages/ui/src/store/`) - Vuex store

  - Modules for different parts of the application

- **Router** (`/packages/ui/src/router/`) - Vue Router routing

- **API** (`/packages/ui/src/api/`) - interaction with backend via Socket.io

- **Helpers** (`/packages/ui/src/helpers/`) - helper functions

  - Event Bus - event system
  - Game State Manager - game state management
  - i18n - internationalization

- **i18n** (`/packages/ui/src/i18n/`) - application localization

### Types

The `types` package contains shared types and interfaces:

- **API** (`/packages/types/api/`) - types for API and sockets
- **Game** (`/packages/types/game/`) - game-related types
  - Addons - types for game addons
  - History - types for game history
  - Mission - types for missions
  - Player - types for players
  - Roles - types for roles
  - State - types for game states
- **Room** (`/packages/types/room/`) - types for rooms
- **User** (`/packages/types/user/`) - types for users
- **Stats** (`/packages/types/stats/`) - types for statistics

## Key Business Processes

### Room Creation and Joining

1. User creates a room or joins an existing one
2. System registers the user in the room
3. Users in the room can communicate via chat
4. Room owner configures game parameters and starts the game

### Game Process

1. System distributes roles among players
2. Game proceeds through a sequence of rounds and missions
3. Each mission includes team selection and voting
4. Players with special roles can use their abilities
5. Game ends with the victory of one side (good or evil)

### Game Addons and Extensions

The game supports various addons:

- Assassin - the assassin can try to kill Merlin at the end of the game
- Lady of the Lake - Lady of the Lake can check player loyalty
- Excalibur - the Excalibur sword provides special abilities
- Plot Cards - plot cards with special effects
- Lancelots - Lancelots can switch sides during the game
- Witch - Witch with special abilities

## Technical Stack

### Backend

- Node.js
- Express
- Socket.io
- MongoDB
- TypeScript

### Frontend

- Vue 3 (Composition API)
- Vuex
- Vue Router
- Vuetify
- TypeScript
- i18n for localization

### Infrastructure

- Docker for development and deployment
- ESLint and Prettier for code formatting
- Jest for testing

## Code Conventions

### General Conventions

- All code is written in TypeScript
- Follow ESLint and Prettier settings
- All new functions must be typed in the `types` package

### Backend

- Use architecture based on managers and classes
- All database interactions through `DBManager`
- All socket interactions handled with `handleSocketErrors`
- Use `eventBus` for communication between different parts of the application

### Frontend

- Use Vue 3 Composition API for new components
- Use Vuex for state management
- Use i18n for internationalization
- Use Vuetify for UI components

### Types

- Use prefix `T` for types (e.g., `TRoomInfo`)
- Use interfaces for objects with methods

## Process for Adding New Features

### Adding New Roles

1. Create a new role class inheriting from abstract classes in `/packages/backend/src/core/roles/abstract.ts`
2. Add types for the new role in `/packages/types/game/roles.ts`
3. Update the frontend to display the new role

### Adding New Addons

1. Create a new addon in `/packages/backend/src/core/game/addons/`
2. Add types for the addon in `/packages/types/game/addons/`
3. Update the frontend to support the new addon

### Adding New API Methods for Addons

1. Add a new parameter type in `TGameMethodsParams` in `/packages/backend/src/core/game-manager/interface.ts`
2. Add handling for the new method in the `callGameMethods` method in `/packages/backend/src/core/game-manager/index.ts`:
   - For plot card methods, use the `handlePlotCardAction` helper method
   - For loyalty-related methods, use the `handleLoyaltyAction` helper method
   - For addon-specific methods, use the `ensureAddonExists` helper method
3. Add a new socket handler in the `createMethodsForGame` method in `/packages/backend/src/main/index.ts`
4. Add a new method in the `ClientToServerEvents` interface in `/packages/types/api/sockets.ts`

## Localization

The project supports multiple languages:

- English (en)
- Russian (ru)
- Chinese (Simplified) (zh_CN)
- Chinese (Traditional) (zh_TW)
- Spanish (es)

All strings should be added to the corresponding localization files in `/packages/ui/src/i18n/langs/`.

## Testing

- Write tests for new functionality
- Use Jest for testing
- Tests should be placed next to the tested code in the `test` directory

## Docker

- Use Docker for development and deployment
- Follow instructions in docker-compose.dev.yml for local development
- Use separate Dockerfile for backend and frontend
