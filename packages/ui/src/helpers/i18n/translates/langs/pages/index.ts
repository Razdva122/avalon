import type { TLanguage } from '@/helpers/i18n/interface';
import { Dictionary } from '@avalon/types';

import { wiki } from '@/helpers/i18n/translates/langs/pages/wiki';
import { lancelots } from '@/helpers/i18n/translates/langs/pages/lancelots';
import { lady } from '@/helpers/i18n/translates/langs/pages/ladyOfTheLake';
import { excalibur } from '@/helpers/i18n/translates/langs/pages/excalibur';

export const pages: { [key in TLanguage]: Dictionary<Dictionary<string>> } = {
  en: {},
  ru: {},
  'zh-CN': {},
  'zh-TW': {},
};

Object.entries({ wiki: wiki, lancelots: lancelots, lady: lady, excalibur: excalibur }).forEach(([key, value]) => {
  Object.keys(pages).forEach((lang) => {
    pages[<TLanguage>lang][key] = value[<TLanguage>lang];
  });
});

export default pages;
