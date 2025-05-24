import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

import { en } from '@/i18n/langs/en';
import { ru } from '@/i18n/langs/ru';
import { es } from '@/i18n/langs/es';
import { zh_CN } from '@/i18n/langs/zh_CN';
import { zh_TW } from '@/i18n/langs/zh_TW';
import { pt } from '@/i18n/langs/pt';

export const translates: { [key in TLanguage]: Dictionary<Dictionary<string> | Dictionary<Dictionary<string>>> } = {
  en,
  ru,
  es,
  'zh-CN': zh_CN,
  'zh-TW': zh_TW,
  pt,
};
