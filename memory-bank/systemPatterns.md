# System Patterns

This file documents architectural patterns, design patterns, and coding conventions used in the Avalon project.

## Project Structure

[11.04.2025 12:22:39] - **Monorepo Architecture**

- The project is organized as a monorepo with three main packages:
  - `packages/backend` - server-side (Node.js, Express, Socket.io, MongoDB)
  - `packages/ui` - client-side (Vue 3, Vuetify, Vuex)
  - `packages/types` - shared types and interfaces for both parts of the application

## Architectural Patterns

[11.04.2025 12:20:37] - **Client-Server Architecture**

- Backend (Node.js) handles game logic, user management, and data persistence
- Frontend (Vue.js) provides the user interface and real-time updates
- WebSocket communication for real-time game state updates

[11.04.2025 12:20:37] - **Event-Driven Architecture**

- Events trigger state changes and updates across the system
- Event bus pattern used for communication between components
- Socket.io for real-time event propagation between client and server

## Design Patterns

[11.04.2025 12:20:37] - **Factory Pattern**

- Used for creating game instances and role assignments
- Allows for flexible configuration of game settings and addons

[11.04.2025 12:20:37] - **Observer Pattern**

- Used for game state updates and notifications
- Components subscribe to relevant state changes

[11.04.2025 12:20:37] - **Strategy Pattern**

- Used for implementing different game addons and role abilities
- Allows for pluggable game mechanics and variations

[11.04.2025 11:57:50] - **Addon Pattern for Game Extensions**

- Game addons (like plot cards, excalibur) follow a consistent interface pattern
- Each addon implements the `IGameAddon` interface with lifecycle hooks:
  - `afterInit()` - Setup stage-specific handlers and game state
  - `beforeStartMission()`, `afterSentTeam()`, etc. - Hooks into game flow
- Observable pattern used for asynchronous game flow control
- Addons can modify game state, add new stages, and introduce new mechanics

## Internationalization

[06.04.2025 11:56:00] - **Multi-language Support**

- The application supports multiple languages:
  - English (en)
  - Russian (ru)
  - Chinese (Simplified) (zh_CN)
  - Chinese (Traditional) (zh_TW)
  - Spanish (es)
  - Portuguese (pt)
- All UI text is stored in language-specific files
- Translation keys follow a hierarchical structure
- SEO metadata is also translated for all supported languages

## Coding Conventions

[11.04.2025 12:20:37] - **TypeScript Typing**

- Strong typing used throughout the codebase
- Interface definitions for all major components
- Type guards for runtime type checking

[11.04.2025 12:20:37] - **Component Structure**

- Vue components follow a consistent structure
- Separation of concerns between UI, state management, and business logic
- Reusable components for common UI elements

[11.04.2025 12:20:37] - **Testing Approach**

- Unit tests for core game logic
- Integration tests for addon functionality
- Test helpers for common testing scenarios
