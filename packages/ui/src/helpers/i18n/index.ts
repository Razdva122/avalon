import { userSettingsInStorage } from '@/store/init';
import locale from 'locale';
import type { IUserSettings } from '@/store/interface';

import type { TLanguage } from '@/i18n/interface';
export * from '@/i18n/interface';

export * from '@/i18n';

export const LanguageMap: { [key in TLanguage]: string } = {
  en: 'English',
  ru: 'Русский',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  es: 'Español',
  pt: 'Português',
};

export function selectLocale(): TLanguage {
  if (userSettingsInStorage) {
    const settings: IUserSettings = JSON.parse(userSettingsInStorage);

    if (settings.locale?.isDefault === false) {
      return settings.locale.value;
    }
  }

  const localeFromRoute = document.location.pathname.split('/')[1];

  const validLanguage = Object.keys(LanguageMap).find((el) => el.toLowerCase() === localeFromRoute.toLocaleLowerCase());

  if (validLanguage) {
    return <TLanguage>validLanguage;
  }

  const parsedLocales = new locale.Locales(navigator.languages);

  return <TLanguage>parsedLocales.best(new locale.Locales(Object.keys(LanguageMap))).language;
}
