import { userInStorage } from '@/store/init';
import locale from 'locale';
import type { IUser } from '@/store/interface';

import type { TLanguage } from '@/helpers/i18n/interface';
export * from '@/helpers/i18n/interface';

export * from '@/helpers/i18n/translates';

export const LanguageMap: { [key in TLanguage]: string } = {
  en: 'English',
  ru: 'Русский',
  zh_TW: '繁體中文',
  zh_CN: '简体中文',
};

export function selectLocale(): TLanguage {
  const localeFromRoute = document.location.pathname.split('/')[1];

  const validLanguage = Object.keys(LanguageMap).find((el) => el.toLowerCase() === localeFromRoute.toLocaleLowerCase());

  if (validLanguage) {
    return <TLanguage>validLanguage;
  }

  if (userInStorage) {
    const user: IUser = JSON.parse(userInStorage);

    if (user.settings?.locale?.isDefault === false) {
      return user.settings.locale.value;
    }
  }

  const parsedLocales = new locale.Locales(navigator.languages);

  return <TLanguage>parsedLocales.best(new locale.Locales(Object.keys(LanguageMap))).language;
}
