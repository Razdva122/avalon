export interface TranslationMessages {
  [key: string]: string | TranslationMessages;
}
import type { TLanguage } from './interface';

// Separate chunks: importing the language list must not load every dictionary.
export const localeLoaders: Record<TLanguage, () => Promise<TranslationMessages>> = {
  en: () => import(/* webpackChunkName: "locale-en" */ './generated/en.json').then((m) => m.default),
  ru: () => import(/* webpackChunkName: "locale-ru" */ './generated/ru.json').then((m) => m.default),
  es: () => import(/* webpackChunkName: "locale-es" */ './generated/es.json').then((m) => m.default),
  pt: () => import(/* webpackChunkName: "locale-pt" */ './generated/pt.json').then((m) => m.default),
  'zh-CN': () => import(/* webpackChunkName: "locale-zh-cn" */ './generated/zh-CN.json').then((m) => m.default),
  'zh-TW': () => import(/* webpackChunkName: "locale-zh-tw" */ './generated/zh-TW.json').then((m) => m.default),
};
