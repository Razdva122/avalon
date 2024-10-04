import { userInStorage } from '@/store/init';
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
  if (userInStorage) {
    const user: IUser = JSON.parse(userInStorage);

    if (user.settings?.locale?.isDefault === false) {
      return user.settings.locale.value;
    }
  }

  const lang = <TLanguage>navigator.language;

  return LanguageMap[lang] ? lang : 'en';
}
