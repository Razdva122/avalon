# Localization

[Documentation index](../../../../docs/README.md) · [UI guide](../../README.md)

## Supported languages

| Runtime locale | Source directory/export | Public URL prefix |
| -------------- | ----------------------- | ----------------- |
| `en`           | `langs/en`, `en`        | None              |
| `ru`           | `langs/ru`, `ru`        | `/ru/`            |
| `es`           | `langs/es`, `es`        | `/es/`            |
| `pt`           | `langs/pt`, `pt`        | `/pt/`            |
| `zh-CN`        | `langs/zh_CN`, `zh_CN`  | `/zh-cn/`         |
| `zh-TW`        | `langs/zh_TW`, `zh_TW`  | `/zh-tw/`         |

`interface.ts` defines `TLanguage`; `index.ts` contains lazy dictionary loaders.
Each language directory has feature modules and an `index.ts` combining them.
Page dictionaries in `langs/pages` and shared feature dictionaries such as
password recovery are combined at generation time.

## Editing and generation

1. Add the key to the relevant source module in all six languages.
2. Keep interpolation names and the nesting of keys consistent.
3. Regenerate dictionaries through serve/build or run from the repository root:

   ```sh
   node packages/ui/scripts/generate-locales.cjs
   ```

4. Run `npm test --workspace=packages/ui`; for public page changes also run
   `npm run build:ui` to verify localized prerendering and navigation.

`src/i18n/generated/*.json` is generated and ignored by Git. Do not edit it.
The browser loads the chosen language and English fallback rather than all six
dictionaries. The locale loader prevents an old request from replacing a newer selection.

## In components

```vue
<template>
  <h1>{{ $t('game.winner') }}</h1>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>
```

Use interpolation for dynamic values and `i18n-t` text slots for user content.
Player names must not be inserted through `v-html`.

## Language selection

Public canonical URLs determine article language. Neutral room/profile routes use
saved preference, supported browser language, then English. Manual choices persist
for guests and accounts. Merely visiting a translated article does not overwrite
that preference. See [SEO and URL policy](../../SEO.md).

Adding a language also requires updating `TLanguage`, loaders, `LanguageMap` in
`helpers/i18n`, the generator, locale/route/SEO lists and all localized build checks.
Copying a language directory alone is insufficient.

AI discussion languages are a separate contract: `en`, `ru`, `zh-tw`.
They do not follow every UI language. See [AI Arena](../../../../docs/ai-rooms.md).
