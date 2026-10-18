import type { TLanguage } from '@/i18n/interface';
import type { GuideLocale } from '../content';

const loaded: Partial<Record<TLanguage, GuideLocale>> = {};
const loaders = {
  en: () => import(/* webpackChunkName: "guides-en" */ '../content'),
  vi: () => import(/* webpackChunkName: "guides-vi" */ './vi'),
  ru: () => import(/* webpackChunkName: "guides-ru" */ './ru'),
  es: () => import(/* webpackChunkName: "guides-es" */ './es'),
  pt: () => import(/* webpackChunkName: "guides-pt" */ './pt'),
  'zh-CN': () => import(/* webpackChunkName: "guides-zh-cn" */ './zh-CN'),
  'zh-TW': () => import(/* webpackChunkName: "guides-zh-tw" */ './zh-TW'),
};

export async function loadGuideLocale(language: TLanguage): Promise<void> {
  if (!loaded[language]) loaded[language] = await loaders[language as keyof typeof loaders]();
}

export function getGuideLocale(language: TLanguage): GuideLocale {
  return loaded[language]!;
}
