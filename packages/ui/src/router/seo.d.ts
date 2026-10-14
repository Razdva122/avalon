import type { TLanguage } from '@/helpers/i18n';

type TRouteMeta = {
  prerender?: boolean;
  skipSiteMap?: boolean;
  lang?: string;
  id?: string;
  breadcrumbs?: Array<{ to: string; title: string }>;
};

type TSingleLangRouteMeta = TRouteMeta & { title: string; description: string; keywords: Array<string> };

type TMultiLangRouteMeta = TRouteMeta & {
  multiLanguage: {
    [key in TLanguage]?: {
      title: string;
      description: string;
      keywords: Array<string>;
      breadcrumbs?: Array<{ to: string; title: string }>;
    };
  };
};

type TNormalizedLangRouteMeta = TSingleLangRouteMeta & { availableLocales: Array<TLanguage>; lang: TLanguage };

type TRoute = {
  path: string;
  name: string;
  priority: number;
  props?: boolean | Record<string, string>;
  meta: TRouteMeta;
};

export type TSingleLangRoute = TRoute & { meta: TSingleLangRouteMeta };
export type TMultiLangRoute = TRoute & { meta: TMultiLangRouteMeta };
export type TNormalizedLangRoute = TRoute & { meta: TNormalizedLangRouteMeta } & { id: string };

export declare const routesSeo: { [key: string]: TSingleLangRoute | TMultiLangRoute };
