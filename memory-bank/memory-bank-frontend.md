# Memory Bank: Avalon Frontend

This document contains information about the frontend part of the Avalon project.

## General Information

The frontend of the Avalon project is built on Vue 3 using Composition API, Vuex for state management, Vue Router for routing, and Vuetify for UI components. All code is written in TypeScript.

## Project Structure

The frontend is located in the `/packages/ui/` directory and has the following structure:

- `/src/` - source code of the application
  - `/api/` - interaction with the backend
  - `/assets/` - static resources (images, icons)
  - `/components/` - reusable components
  - `/helpers/` - helper functions and utilities
  - `/i18n/` - localization
  - `/pages/` - application pages
  - `/plugins/` - Vue plugins
  - `/router/` - routing
  - `/store/` - Vuex store
  - `/styles/` - global styles

## Key Components

### API and Backend Interaction

Interaction with the backend is done through Socket.io:

- `/src/api/socket.ts` - main socket instance and authentication handling
- `/src/api/const.ts` - API constants like socket URL

The socket connection is established with authentication token:

```typescript
export const socket: Socket = io(socketURL, {
  withCredentials: true,
  auth: {
    token: getAuthToken(),
  },
});
```

### Components

Components are organized by functional groups:

- `/src/components/dev/` - development components
- `/src/components/feedback/` - feedback components (like LocalizedTextWrapper)
- `/src/components/header/` - header components
- `/src/components/modals/` - modal windows
- `/src/components/stats/` - statistics components
- `/src/components/user/` - user-related components
- `/src/components/view/` - view components for game interface

### Pages

Main application pages:

- `/src/pages/about/` - "About" page
- `/src/pages/empty/` - Empty pages (like NotFound)
- `/src/pages/lobby/` - game lobby
- `/src/pages/profile/` - user profile
- `/src/pages/room/` - game room
- `/src/pages/stats/` - statistics
- `/src/pages/wiki/` - wiki with game rules and role descriptions

### Store (Vuex)

Vuex store is used for application state management:

- `/src/store/index.ts` - main store file with state, mutations, and actions
- `/src/store/const.ts` - store constants
- `/src/store/init.ts` - store initialization and loading from localStorage
- `/src/store/interface.ts` - store interfaces
- `/src/store/persistent.ts` - persistent storage handling

The main state structure:

```typescript
export interface IState {
  profile: UserWithToken | null;
  users: Dictionary<TUserState>;
  settings: IUserSettings | null;
  hideSpoilers: boolean;
  connect: boolean | null;
  alerts: TAlerts;
}
```

User settings structure:

```typescript
export interface IUserSettings {
  locale?: { value: TLanguage; isDefault: boolean };
  hideIndexInHistory?: boolean;
  colorTheme?: 'light' | 'dark';
  style?: 'default' | 'anime';
}
```

### Routing

Routing is done using Vue Router:

- `/src/router/index.ts` - main routing file
- `/src/router/seo.js` - SEO optimization for routes

The router supports multilingual routes and SEO optimization. Routes are dynamically generated based on the `routesSeo` configuration and the `routeComponentMap` that maps route names to components.

### Localization

The project supports multilingualism using vue-i18n:

- `/src/i18n/index.ts` - translation exports
- `/src/i18n/interface.ts` - language type definitions
- `/src/i18n/langs/` - translation files for each language
- `/src/plugins/i18n/index.ts` - i18n plugin configuration
- `/src/helpers/i18n/index.ts` - helper functions for language selection

Supported languages:

- English (en)
- Russian (ru)
- Chinese (Simplified) (zh-CN)
- Chinese (Traditional) (zh-TW)
- Spanish (es)
- Portuguese (pt)

Language selection is based on:

1. User settings (if explicitly set)
2. URL path language prefix
3. Browser language preferences

### Helper Functions

Helper functions and utilities:

- `/src/helpers/event-bus/` - simple event bus for specific UI events
- `/src/helpers/game-state-manager/` - game state management and history navigation
- `/src/helpers/i18n/` - localization helpers
- `/src/helpers/images/` - image handling
- `/src/helpers/scss/` - SCSS helper functions
- `/src/helpers/setup/` - application setup
- `/src/helpers/stats/` - statistics handling
- `/src/helpers/styles/` - style handling
- `/src/helpers/utility/` - general utilities
- `/src/helpers/validators/` - form validators

## Game Interface

### Game State Manager

The GameStateManager (`/src/helpers/game-state-manager/index.ts`) is responsible for:

- Managing the game state and history
- Providing navigation through game history
- Calculating visual representation of game states
- Handling special game events like role changes

The manager maintains a history of game states and allows viewing previous states:

```typescript
export class GameStateManager {
  state: TPageRoomStateRef;
  game: Ref<VisualGameState>;
  viewMode: Ref<'live' | 'history'> = ref('live');

  // Methods for navigating through history
  moveToNextStage(): void {
    /* ... */
  }
  moveToPrevStage(): void {
    /* ... */
  }

  // Methods for updating game state
  mutateRoomState(/* ... */): void {
    /* ... */
  }

  // Toggle between live and history view
  toggleViewMode(): void {
    /* ... */
  }
}
```

### Event Bus

The event bus (`/src/helpers/event-bus/index.ts`) is used for specific UI events:

```typescript
export type IBusEvents = {
  infoMessage: (message: string) => void;
  openAuthModal: () => void;
  openCredentialsModal: (type: 'email' | 'login' | 'password') => void;
};
```

It's primarily used for showing messages and opening modals, not for general component communication.

## Styles and Themes

### Vuetify

The project uses Vuetify for UI components:

- `/src/plugins/vuetify/` - Vuetify configuration

### Global Styles

Global styles are defined in:

- `/src/styles/` - global style files

## Portuguese Translation Implementation

The project has been extended with Portuguese language support:

### Translation Files

- `/src/i18n/langs/pt.ts` - Main Portuguese translation file containing all UI strings
- `/src/i18n/langs/pages/pt.ts` - Portuguese translations for pages
- Individual page and role translation files have been updated with Portuguese translations

### Configuration Updates

- Added 'pt' to TLanguage type in `/src/i18n/interface.ts`
- Added 'pt': 'Português' to LanguageMap in `/src/helpers/i18n/index.ts`
- Updated translations export in `/src/i18n/index.ts`
- Added Portuguese default keywords for SEO in `/src/router/index.ts`

### SEO Optimization

- All SEO files in `/src/i18n/langs/pages/seo/` have been updated with Portuguese translations
- Meta tags, titles, and descriptions are now available in Portuguese
- Default keywords for Portuguese: ['The Resistance', 'Avalon', 'Online', 'Jogo de tabuleiro']

### Translation Coverage

The Portuguese translation covers:

- All UI elements and navigation
- All game mechanics and instructions
- All role descriptions and wiki content
- All error messages and notifications
- All SEO metadata

## Frontend Recommendations

1. Use Composition API for new components
2. Follow the single responsibility principle for components
3. Use types from the `types` package for type safety
4. Add new localization strings to all language files (including Portuguese)
5. Test the interface on various devices and screen resolutions
6. Use Vuex for global state management
7. Use the GameStateManager for game state handling
8. Follow the existing routing patterns for new pages

## Rating and Statistics Display

The frontend includes components for displaying player ratings and statistics:

### Rating Components

- `/src/components/stats/` contains components for displaying ratings and leaderboards
- Ratings are displayed per role, showing rank, rating score, winrate, and games count
- Players with rank 1 in any role get a special "TOP-1" badge on their profile

### Rating API Interaction

The frontend interacts with the rating system through socket events:

- `getRoleLeaderboard`: Fetches the top 20 players for a specific role
- `getUserRatings`: Fetches all ratings for the current user
- `getRatingHistory`: Fetches rating history for a user and role over the last 30 days

### Rating Visualization

- Rating history is displayed using charts
- Leaderboards show player rankings with visual indicators
- Player profiles display their best roles and achievements

## Role Page Top Player Component

A component has been added to display the top-rated player for each role on the role's wiki page:

### TopRolePlayer Component

- Located at `/src/components/stats/TopRolePlayer.vue`
- Displays the top-ranked player for a specific role
- Shows player avatar, name, rating, winrate, and games count
- Automatically fetches data using the `getRoleLeaderboard` socket event
- Uses inset and inset-hover colors for consistent styling with the wiki pages

### Integration with Role Pages

The component should be placed after the general information section on role pages:

```vue
<template>
  <div class="info-page-content">
    <h1>Role Name</h1>
    <SchemaImage ... />

    <h2>General Information</h2>
    <p>General information about the role...</p>

    <!-- Place the TopRolePlayer component after general information -->
    <TopRolePlayer role="roleName" class="my-4" />

    <!-- Rest of the page content -->
  </div>
</template>

<script>
import TopRolePlayer from '@/components/stats/TopRolePlayer.vue';

export default {
  components: {
    TopRolePlayer,
    // Other components
  },
};
</script>
```

### Styling and Empty State

The component uses Vuetify's inset and inset-hover colors for consistent styling with the wiki pages:

```scss
.top-player-card {
  background-color: var(--v-inset-base);

  &:hover {
    background-color: var(--v-inset-hover);
  }
}
```

When there are no players with a rating greater than 0, the component displays a styled "no data" card instead of just text:

```vue
<v-card v-else class="top-player-card no-data-card">
  <div class="d-flex align-center pa-3">
    <div class="no-data-icon mr-2">🏆</div>
    <div class="no-data-text">
      {{ $t('stats.noTopPlayerData') }}
    </div>
  </div>
</v-card>
```

### Translations

The component uses the following translation keys in the `stats` namespace:

- `topPlayerTitle`: Title for the component ("Top Player")
- `gamesPlayed`: Text showing games count ("{count} games")
- `noTopPlayerData`: Text shown when no data is available
