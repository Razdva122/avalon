import type { TLanguage } from '@/helpers/i18n/interface';
import { Dictionary } from '@avalon/types';

import { en } from '@/helpers/i18n/translates/langs/en';
import { ru } from '@/helpers/i18n/translates/langs/ru';
import { zh_CN } from '@/helpers/i18n/translates/langs/zh_CN';
import { zh_TW } from '@/helpers/i18n/translates/langs/zh_TW';

export const translates: { [key in TLanguage]: Dictionary<Dictionary<string>> } = {
  en,
  ru,
  'zh-CN': zh_CN,
  'zh-TW': zh_TW,
};
