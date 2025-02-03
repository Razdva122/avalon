import { createI18n } from 'vue-i18n';

import { selectLocale } from '@/helpers/i18n';
import { translates } from '@/i18n';

export const i18n = createI18n({
  warnHtmlMessage: false,
  legacy: false,
  locale: selectLocale(),
  fallbackLocale: 'en',
  messages: translates,
});
