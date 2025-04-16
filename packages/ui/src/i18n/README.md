# Translation System Documentation

This document explains the structure and usage of the translation system in the Avalon project.

## Structure

Our translation system is organized by feature to make maintenance easier:

```
packages/ui/src/i18n/langs/
├── en/                   # English translations
│   ├── index.ts          # Exports all English translations
│   ├── menu.ts           # Menu-related translations
│   ├── room.ts           # Room-related translations
│   ├── game.ts           # Game mechanics translations
│   ├── roles.ts          # Role names and descriptions
│   ├── addons.ts         # Game addons translations
│   ├── history.ts        # Game history translations
│   ├── ui.ts             # Common UI elements
│   ├── errors.ts         # Error messages
│   └── modals.ts         # Modal dialogs translations
├── ru/                   # Russian translations (same structure)
├── es/                   # Spanish translations (same structure)
└── ...                   # Other languages
```

Each feature module contains translations related to a specific aspect of the application:

- `menu.ts`: Navigation and menu items
- `room.ts`: Room-related translations
- `game.ts`: Game mechanics translations
- `roles.ts`: Role names and descriptions
- `addons.ts`: Game addons translations
- `history.ts`: Game history translations
- `ui.ts`: Common UI elements
- `errors.ts`: Error messages
- `modals.ts`: Modal dialogs translations

## Usage in Components

The usage in components remains unchanged:

```vue
<template>
  <h1>{{ $t('game.winner') }}</h1>
  <p>{{ $t('endReason.evilTeamMissions') }}</p>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
// Usage in script remains the same
console.log(t('roles.merlin'));
</script>
```

## Adding New Translations

1. Identify which feature module the translation belongs to
2. Add the translation to that module for each supported language
3. Follow the existing key structure

Example:

```typescript
// packages/ui/src/i18n/langs/en/game.ts
export default {
  game: {
    // Existing translations...
    newFeature: 'New Feature',
  },
};
```

## Adding New Languages

1. Create a new directory for the language in `packages/ui/src/i18n/langs/`
2. Copy the structure from an existing language (e.g., English)
3. Translate all the strings
4. Update `packages/ui/src/i18n/index.ts` to include the new language
5. Update `packages/ui/src/helpers/i18n/index.ts` to add the language to `LanguageMap`

## Manual Migration for Other Languages

For languages other than English, follow these steps to manually migrate:

1. Create the language directory:

   ```bash
   mkdir -p packages/ui/src/i18n/langs/[language_code]
   ```

2. For each category (menu, game, roles, etc.), create a new file:

   ```bash
   touch packages/ui/src/i18n/langs/[language_code]/[category].ts
   ```

3. Copy the relevant sections from the original language file to the new category file:

   ```typescript
   /**
    * Category-related translations for Language
    * This file contains translations for category
    */
   export default {
     key1: {
       /* translations */
     },
     key2: {
       /* translations */
     },
   };
   ```

4. Create an index.ts file to export all modules:

   ```typescript
   /**
    * Main export file for Language translations
    * Imports and combines all feature-specific translation modules
    */
   import pages from '@/i18n/langs/pages';
   import menu from './menu';
   import room from './room';
   import game from './game';
   import roles from './roles';
   import addons from './addons';
   import history from './history';
   import ui from './ui';
   import errors from './errors';
   import modals from './modals';

   export const [language_code] = {
     ...menu,
     ...room,
     ...game,
     ...roles,
     ...addons,
     ...history,
     ...ui,
     ...errors,
     ...modals,
     ...pages.[language_code],
   };
   ```

## Best Practices

- Keep keys consistent across all languages
- Use descriptive key names
- Group related translations together
- Use interpolation for dynamic content: `'Hello, {name}'`
- Document any special formatting or HTML usage

## Benefits of This Structure

1. **Improved Organization**: Translations are logically grouped by feature
2. **Better Maintainability**: Smaller files are easier to manage
3. **Minimal Disruption**: No changes to how translations are used in components
4. **Easier Collaboration**: Multiple developers can work on different features without conflicts
5. **Scalability**: System can easily accommodate new features and languages
