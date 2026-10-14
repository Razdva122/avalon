import type { TLanguage } from '@/i18n/interface';
import { guides, copy } from '../content';
import type { GuideLocale } from '../content';

const loaded: Partial<Record<TLanguage, GuideLocale>> = { en: { guides, copy } };
const loaders = {
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
