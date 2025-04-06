import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

import { wiki } from '@/i18n/langs/pages/wiki';
import { lancelots } from '@/i18n/langs/pages/roles/lancelots';
import { lady } from '@/i18n/langs/pages/ladyOfTheLake';
import { excalibur } from '@/i18n/langs/pages/excalibur';
import { plotCards } from '@/i18n/langs/pages/plotCards';
import { morgana } from '@/i18n/langs/pages/roles/morgana';
import { percival } from '@/i18n/langs/pages/roles/percival';
import { rules } from '@/i18n/langs/pages/rules';
import { lovers } from '@/i18n/langs/pages/roles/lovers';
import { about } from '@/i18n/langs/pages/about';
import { merlin } from '@/i18n/langs/pages/roles/merlin';
import { oberon } from '@/i18n/langs/pages/roles/oberon';
import { mordred } from '@/i18n/langs/pages/roles/mordred';
import { troublemaker } from '@/i18n/langs/pages/roles/troublemaker';
import { trickster } from '@/i18n/langs/pages/roles/trickster';
import { ladySea } from '@/i18n/langs/pages/ladyOfTheSea';
import { witch } from '@/i18n/langs/pages/roles/witch';
import { brute } from '@/i18n/langs/pages/roles/brute';
import { lunatic } from '@/i18n/langs/pages/roles/lunatic';
import { guinevere } from '@/i18n/langs/pages/roles/guinevere';
import { merlinPure } from '@/i18n/langs/pages/roles/merlinPure';
import { minion } from '@/i18n/langs/pages/roles/minion';
import { servant } from '@/i18n/langs/pages/roles/servant';
import { cleric } from '@/i18n/langs/pages/roles/cleric';
import { revealer } from '@/i18n/langs/pages/roles/revealer';
import { stats } from '@/i18n/langs/pages/stats';
import { userStats } from '@/i18n/langs/pages/userStats';

export const pages: { [key in TLanguage]: Dictionary<Dictionary<string>> } = {
  en: {},
  ru: {},
  'zh-CN': {},
  'zh-TW': {},
  es: {},
  pt: {},
};

Object.entries({
  wiki,
  lancelots,
  lady,
  ladySea,
  excalibur,
  plotCards,
  morgana,
  percival,
  rules,
  lovers,
  merlin,
  about,
  oberon,
  mordred,
  troublemaker,
  trickster,
  witch,
  brute,
  lunatic,
  guinevere,
  merlinPure,
  minion,
  servant,
  cleric,
  revealer,
  stats,
  userStats,
}).forEach(([key, value]) => {
  Object.keys(pages).forEach((lang) => {
    pages[<TLanguage>lang][key] = value[<TLanguage>lang];
  });
});

export default pages;
