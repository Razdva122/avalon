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
  vi: () => import(/* webpackChunkName: "locale-vi" */ './generated/vi.json').then((m) => m.default),
  'zh-CN': () => import(/* webpackChunkName: "locale-zh-cn" */ './generated/zh-CN.json').then((m) => m.default),
  'zh-TW': () => import(/* webpackChunkName: "locale-zh-tw" */ './generated/zh-TW.json').then((m) => m.default),
};

// Full article bodies are needed only on wiki routes.
export const wikiLocaleLoaders: Record<TLanguage, () => Promise<TranslationMessages>> = {
  en: () => import(/* webpackChunkName: "wiki-locale-en" */ './generated/wiki-en.json').then((m) => m.default),
  ru: () => import(/* webpackChunkName: "wiki-locale-ru" */ './generated/wiki-ru.json').then((m) => m.default),
  es: () => import(/* webpackChunkName: "wiki-locale-es" */ './generated/wiki-es.json').then((m) => m.default),
  pt: () => import(/* webpackChunkName: "wiki-locale-pt" */ './generated/wiki-pt.json').then((m) => m.default),
  vi: () => import(/* webpackChunkName: "wiki-locale-vi" */ './generated/wiki-vi.json').then((m) => m.default),
  'zh-CN': () =>
    import(/* webpackChunkName: "wiki-locale-zh-cn" */ './generated/wiki-zh-CN.json').then((m) => m.default),
  'zh-TW': () =>
    import(/* webpackChunkName: "wiki-locale-zh-tw" */ './generated/wiki-zh-TW.json').then((m) => m.default),
};

// This expansion's full guide is not needed on unrelated wiki pages.
export const trapperLocaleLoaders: Record<TLanguage, () => Promise<TranslationMessages>> = {
  en: () => import(/* webpackChunkName: "trapper-locale-en" */ './generated/trapper-en.json').then((m) => m.default),
  ru: () => import(/* webpackChunkName: "trapper-locale-ru" */ './generated/trapper-ru.json').then((m) => m.default),
  es: () => import(/* webpackChunkName: "trapper-locale-es" */ './generated/trapper-es.json').then((m) => m.default),
  pt: () => import(/* webpackChunkName: "trapper-locale-pt" */ './generated/trapper-pt.json').then((m) => m.default),
  vi: () => import(/* webpackChunkName: "trapper-locale-vi" */ './generated/trapper-vi.json').then((m) => m.default),
  'zh-CN': () =>
    import(/* webpackChunkName: "trapper-locale-zh-cn" */ './generated/trapper-zh-CN.json').then((m) => m.default),
  'zh-TW': () =>
    import(/* webpackChunkName: "trapper-locale-zh-tw" */ './generated/trapper-zh-TW.json').then((m) => m.default),
};
