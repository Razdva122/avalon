import { createI18n } from 'vue-i18n';
import { selectLocale } from '@/helpers/i18n';
import { localeLoaders, type TranslationMessages } from '@/i18n';
import type { TLanguage } from '@/i18n/interface';
import { createMessageLoader, createLanguageSelection } from './loader';

export const i18n = createI18n({
  warnHtmlMessage: false,
  legacy: false,
  locale: selectLocale(),
  fallbackLocale: 'en',
  messages: {} as Record<string, TranslationMessages>,
});

export const loadLanguage = createMessageLoader<TLanguage, TranslationMessages>(localeLoaders, (language, messages) => {
  i18n.global.setLocaleMessage(language, messages);
});

// Latest user selection wins; a completed route navigation also invalidates
// pending private-page selections.
export const { select: setLanguage, commit: commitLanguage } = createLanguageSelection<TLanguage>(
  loadLanguage,
  (language) => {
    i18n.global.locale.value = language;
  },
);
