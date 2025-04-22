# System Patterns

[2025-04-22 19:41:04] - TrueSkill Rating System Architecture

The TrueSkill rating system implementation follows several architectural patterns:

## Singleton Pattern

- The `trueSkillCalculator` is implemented as a singleton to ensure consistent configuration and behavior throughout the application.
- Example: `export const trueSkillCalculator = new TrueSkillCalculator();`

## Repository Pattern

- Database interactions are encapsulated in models that provide a clean interface for data access.
- Models like `playerTrueSkillRatingModel`, `gameTrueSkillResultModel`, and `trueSkillRatingHistoryModel` abstract the database operations.

## Strategy Pattern

- The rating calculation uses different strategies for winners vs. losers and for players with different relative skill levels.
- The `calculateSkillAdjustmentFactor` method implements this pattern by applying different calculation strategies based on context.

## Facade Pattern

- The `trueSkillRatingEndpoints.ts` file provides a simple interface to the complex TrueSkill system.
- It exposes only the necessary methods while hiding the implementation details.

## Observer Pattern

- The rating system uses the observer pattern through socket events to notify clients of rating changes.
- Components like `UserTrueSkillRating.vue` observe these changes and update accordingly.

## Composition Pattern

- Frontend components are composed to create a complete user interface for displaying TrueSkill ratings.
- For example, `UserProfileHeader.vue` composes `UserTrueSkillRating.vue` and other components.

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

## Mobile Adaptation Patterns

[13.04.2025 00:03:24] - **Long Press for Mobile Hover Alternatives**

- For components that use hover interactions on desktop (like tooltips and hover cards):
  - Use `useLongPress` from `@vueuse/core` to detect long press gestures on mobile
  - Show content in modals or dialogs on mobile devices
  - Maintain separate interaction paths for desktop (hover) and mobile (long press)
  - Use media queries like `@media (hover: none)` to target touch devices specifically
  - Provide visual feedback during long press interactions

[13.04.2025 00:03:24] - **Responsive UI Components**

- Components adapt their behavior based on device capabilities:
  - Check for touch support using `window.matchMedia('(hover: none)').matches`
  - Use Vuetify's responsive components (v-dialog, v-bottom-sheet) for mobile interfaces
  - Optimize layout and sizing for different screen sizes

## Rating System Patterns

[16.04.2025 22:19:35] - **Team-Adjusted ELO Rating System**

- ELO rating calculations enhanced with team strength considerations:

  - Calculate individual expected scores based on player rating vs. opposing team average
  - Apply team strength adjustment factor based on relative team strengths
  - Scale rating changes proportionally to team rating differences
  - Use configurable influence factor (15%) to control the strength of the adjustment
  - Maintain different K-factors based on player experience (games played)

- Implementation follows these patterns:

  - Separation of calculation steps for maintainability
  - Configurable constants for easy tuning
  - Clear documentation with diagrams and examples
  - Comprehensive comparison with alternative rating systems
  - Bounded rating range (0-10000) to prevent extreme values

- This pattern can be applied to other team-based rating systems where:
  - Individual performance is affected by team composition
  - Teams have asymmetric roles or abilities
  - Rating changes should reflect both individual and team factors

[17.04.2025 00:04:43] - **Balanced Win Probability ELO Formula**

- Modified ELO expected score calculation for more realistic win probabilities:

  - Adjust the divisor in the ELO formula from standard 400 to 800
  - Flatten the probability curve to give more balanced expected outcomes
  - Provide ~70% win probability for a 1000 rating difference (vs. ~95% in standard ELO)
  - Create more reasonable rating changes for games with significant rating differences

- Implementation follows these patterns:

  - Single-point modification with widespread effects
  - Configurable constant for easy tuning
  - Visual representation of probability curves for comparison
  - Comprehensive documentation of effects on different rating scenarios
  - Preservation of the fundamental ELO formula structure

- This pattern can be applied to other rating systems where:
  - Standard win probability curves are too steep
  - Large rating differences should still allow for reasonable upset chances
  - Rating changes need to be more balanced across different skill levels
