import { userInStorage } from '@/store/init';
import locale from 'locale';
import type { IUser } from '@/store/interface';

import type { TLanguage } from '@/i18n/interface';
export * from '@/i18n/interface';

export * from '@/i18n';

export const LanguageMap: { [key in TLanguage]: string } = {
  en: 'English',
  ru: 'Русский',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  es: 'Español',
};

export function selectLocale(): TLanguage {
  if (userInStorage) {
    const user: IUser = JSON.parse(userInStorage);

    if (user.settings?.locale?.isDefault === false) {
      return user.settings.locale.value;
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
