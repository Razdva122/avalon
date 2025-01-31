import type { TLanguage } from '@/helpers/i18n/interface';
import { Dictionary } from '@avalon/types';

import { wiki } from '@/helpers/i18n/translates/langs/pages/wiki';
import { lancelots } from '@/helpers/i18n/translates/langs/pages/lancelots';
import { lady } from '@/helpers/i18n/translates/langs/pages/ladyOfTheLake';
import { excalibur } from '@/helpers/i18n/translates/langs/pages/excalibur';
import { morgana } from '@/helpers/i18n/translates/langs/pages/morgana';
import { percival } from '@/helpers/i18n/translates/langs/pages/percival';
import { rules } from '@/helpers/i18n/translates/langs/pages/rules';
import { lovers } from '@/helpers/i18n/translates/langs/pages/lovers';
import { about } from '@/helpers/i18n/translates/langs/pages/about';
import { merlin } from '@/helpers/i18n/translates/langs/pages/merlin';
import { oberon } from '@/helpers/i18n/translates/langs/pages/oberon';
import { mordred } from '@/helpers/i18n/translates/langs/pages/mordred';
import { troublemaker } from '@/helpers/i18n/translates/langs/pages/troublemaker';
import { trickster } from '@/helpers/i18n/translates/langs/pages/trickster';
import { ladySea } from '@/helpers/i18n/translates/langs/pages/ladyOfTheSea';

export const pages: { [key in TLanguage]: Dictionary<Dictionary<string>> } = {
  en: {},
  ru: {},
  'zh-CN': {},
  'zh-TW': {},
  es: {},
};

Object.entries({
  wiki: wiki,
  lancelots: lancelots,
  lady: lady,
  ladySea: ladySea,
  excalibur: excalibur,
  morgana: morgana,
  percival: percival,
  rules: rules,
  lovers: lovers,
  merlin: merlin,
  about: about,
  oberon: oberon,
  mordred: mordred,
  troublemaker: troublemaker,
  trickster: trickster,
}).forEach(([key, value]) => {
  Object.keys(pages).forEach((lang) => {
    pages[<TLanguage>lang][key] = value[<TLanguage>lang];
  });
});

export default pages;
