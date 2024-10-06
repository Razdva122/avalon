import { createI18n } from 'vue-i18n';

import { selectLocale, translates } from '@/helpers/i18n';

export const i18n = createI18n({
  locale: selectLocale(),
  fallbackLocale: 'en',
  messages: translates,
});
