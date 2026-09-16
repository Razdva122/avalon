import { watch } from 'vue';
import { store } from '@/store';
import { pageLanguage, preferredLanguage } from '@/helpers/i18n/policy';
import { createRouter, createWebHistory, RouteRecordRaw, RouteLocationNormalized } from 'vue-router';
import { routesSeo } from '@/router/seo';
import type { TMultiLangRoute, TNormalizedLangRoute } from '@/router/seo';
import Lobby from '@/pages/lobby/Lobby.vue';
import cloneDeep from 'lodash/cloneDeep';
import { TLanguage, LanguageMap } from '@/helpers/i18n';
import { s3ImagesPath } from '@/helpers/images';
import { i18n } from '@/plugins/i18n';
import { basePath, localizedPath, isNeutralPath } from './paths';

const routeComponentMap = {
  lobby: Lobby,
  wiki: () => import('@/pages/wiki/Index.vue'),
  notFound: () => import('@/pages/empty/NotFound.vue'),
  room: () => import('@/pages/room/Room.vue'),
  roles: () => import('@/pages/wiki/roles/Index.vue'),
  expansions: () => import('@/pages/wiki/addons/Index.vue'),
  lancelots: () => import('@/pages/wiki/roles/Lancelots.vue'),
  lady_of_lake: () => import('@/pages/wiki/addons/LadyOfTheLake.vue'),
  lady_of_sea: () => import('@/pages/wiki/addons/LadyOfTheSea.vue'),
  plot_cards: () => import('@/pages/wiki/addons/PlotCards.vue'),
  excalibur: () => import('@/pages/wiki/addons/Excalibur.vue'),
  morgana: () => import('@/pages/wiki/roles/Morgana.vue'),
  percival: () => import('@/pages/wiki/roles/Percival.vue'),
  rules: () => import('@/pages/wiki/Rules.vue'),
  lovers: () => import('@/pages/wiki/roles/Lovers.vue'),
  merlin: () => import('@/pages/wiki/roles/Merlin.vue'),
  about: () => import('@/pages/about/About.vue'),
  oberon: () => import('@/pages/wiki/roles/Oberon.vue'),
  mordred: () => import('@/pages/wiki/roles/Mordred.vue'),
  troublemaker: () => import('@/pages/wiki/roles/Troublemaker.vue'),
  trickster: () => import('@/pages/wiki/roles/Trickster.vue'),
  witch: () => import('@/pages/wiki/roles/Witch.vue'),
  brute: () => import('@/pages/wiki/roles/Brute.vue'),
  lunatic: () => import('@/pages/wiki/roles/Lunatic.vue'),
  guinevere: () => import('@/pages/wiki/roles/Guinevere.vue'),
  merlin_pure: () => import('@/pages/wiki/roles/MerlinPure.vue'),
  servant: () => import('@/pages/wiki/roles/Servant.vue'),
  minion: () => import('@/pages/wiki/roles/Minion.vue'),
  cleric: () => import('@/pages/wiki/roles/Cleric.vue'),
  revealer: () => import('@/pages/wiki/roles/Revealer.vue'),
  stats: () => import('@/pages/stats/Stats.vue'),
  profile: () => import('@/pages/profile/Profile.vue'),
  user_stats: () => import('@/pages/stats/UserStats.vue'),
  leaderboard: () => import('@/pages/leaderboard/Leaderboard.vue'),
  user_achievements: () => import('@/pages/achievements/UserAchievements.vue'),
  global_achievements: () => import('@/pages/achievements/GlobalAchievements.vue'),
};

const legacyRoutes = {
  '/wiki/addons/lady/': '/wiki/expansions/lady/',
  '/wiki/addons/lady_sea/': '/wiki/expansions/lady_sea/',
  '/wiki/addons/excalibur/': '/wiki/expansions/excalibur/',
  '/wiki/addons/plot_cards/': '/wiki/expansions/plot_cards/',
  '/wiki/addons/': '/wiki/expansions/',
  '/wiki/roles/isolde/': '/wiki/roles/lovers/',
  '/wiki/roles/tristan/': '/wiki/roles/lovers/',
  '/wiki/roles/wraith/': '/wiki/roles/oberon/',
  '/wiki/roles/evil_lancelot/': '/wiki/roles/lancelots/',
  '/wiki/roles/good_lancelot/': '/wiki/roles/lancelots/',
};

export const routes: Array<RouteRecordRaw> = [
  {
    path: '/en/:pathMatch(.*)*',
    redirect: (to) => ({ path: basePath(to.path), query: to.query, hash: to.hash }),
  },
  {
    path: '/:catchAll(.*)',
    redirect: (to) => {
      const language = Object.keys(LanguageMap).find((lang) => lang.toLowerCase() === to.path.split('/')[1]);
      return localizedPath('/404/', language || 'en');
    },
  },
];

Object.entries(legacyRoutes).forEach(([path, target]) => {
  Object.keys(LanguageMap).forEach((language) => {
    routes.push({
      path: localizedPath(path, language),
      // Keep names used by role preview links for the original English aliases.
      name: language === 'en' && path.startsWith('/wiki/roles/') ? path.split('/').filter(Boolean).pop() : undefined,
      redirect: (to) => ({ path: localizedPath(target, language), query: to.query, hash: to.hash }),
    });
  });
});

Object.values(routesSeo).forEach((route) => {
  if ('multiLanguage' in route.meta && route.meta.multiLanguage) {
    const multiLangRoute = <TMultiLangRoute>route;

    const neutral = isNeutralPath(route.path);
    if (neutral) {
      Object.keys(multiLangRoute.meta.multiLanguage)
        .filter((lang) => lang !== 'en')
        .forEach((lang) => {
          routes.push({
            path: localizedPath(route.path, lang),
            redirect: (to) => ({ path: basePath(to.path), query: to.query, hash: to.hash, replace: true }),
          });
        });
    }
    routes.push(
      ...(neutral ? ['en'] : Object.keys(multiLangRoute.meta.multiLanguage)).map((lang) => {
        const clone = cloneDeep(multiLangRoute);
        const langNormalized = lang === 'en' ? '' : lang.toLowerCase();

        // @ts-ignore
        delete clone.meta.multiLanguage;

        // @ts-ignore
        (<TNormalizedLangRoute>(<unknown>clone)).meta = {
          ...clone.meta,
          availableLocales: <TLanguage[]>Object.keys(multiLangRoute.meta.multiLanguage),
          lang: <TLanguage>lang,
          id: clone.name,
          ...multiLangRoute.meta.multiLanguage[<TLanguage>lang || 'en'],
        };

        clone.name += langNormalized;

        if (langNormalized) {
          clone.path = localizedPath(clone.path, lang);
        }

        return <RouteRecordRaw>{ ...clone, component: routeComponentMap[<keyof typeof routeComponentMap>route.name] };
      }),
    );
  }
});

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

const defaultKeywords: { [key in Lowercase<TLanguage>]: string[] } = {
  en: ['The Resistance', 'Avalon', 'Online', 'Board Game'],
  ru: ['Сопротивление', 'Авалон', 'Онлайн', 'Настольная Игра'],
  'zh-tw': ['反抗勢力', '亞瓦隆', '在線', '桌遊'],
  'zh-cn': ['反抗组织', '阿瓦隆', '在线', '桌游'],
  es: ['La Resistencia', 'Avalon', 'En línea', 'Juego de mesa'],
  pt: ['The Resistance', 'Avalon', 'Online', 'Jogo de tabuleiro'],
};

router.beforeEach((to, from, next) => {
  if (!to.path.endsWith('/')) {
    next({ path: `${to.path}/`, query: to.query, hash: to.hash, replace: true });
    return;
  }

  next();
});

router.afterEach((to, _from, failure) => {
  if (failure) return;
  i18n.global.locale.value = pageLanguage(
    to.path,
    isNeutralPath(to.path),
    preferredLanguage(store.state.settings, navigator.languages),
  );
  updateMetadata(to);
});

function updateMetadata(to: RouteLocationNormalized) {
  let meta = to.meta;
  if (isNeutralPath(to.path)) {
    // A room URL is shared, but its title and interface use the recipient's language.
    const source = Object.values(routesSeo).find((route) => route.name === meta.id) as TMultiLangRoute | undefined;
    meta = {
      ...meta,
      ...source?.meta.multiLanguage[i18n.global.locale.value as TLanguage],
      lang: i18n.global.locale.value,
    };
  }
  document.documentElement.lang = i18n.global.locale.value;

  let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (!robots) {
    robots = document.createElement('meta');
    robots.name = 'robots';
    document.head.appendChild(robots);
  }
  robots.content = meta.skipSiteMap ? 'noindex, follow' : 'index, follow';

  const keywords = <string[]>meta.keywords ?? [];
  const image = <string>meta.image || 'roles/merlin.webp';
  const url = 'https://avalon-game.com';

  document.querySelector('head meta[property="og:image"]')!.setAttribute('content', `${s3ImagesPath}${image}`);

  document.title = <string>meta.title;
  document.querySelector('head meta[property="og:title"]')!.setAttribute('content', <string>meta.title);

  document.querySelector('head meta[name="description"]')!.setAttribute('content', <string>meta.description);
  document.querySelector('head meta[property="og:description"]')!.setAttribute('content', <string>meta.description);

  document
    .querySelector('head meta[name="keywords"]')!
    // @ts-ignore
    .setAttribute('content', [...keywords, ...defaultKeywords[(meta.lang || 'en').toLowerCase()]].join(', '));

  document.querySelector('link[rel="canonical"]')!.setAttribute('href', url + to.path);
  document.querySelector('head meta[property="og:url"]')!.setAttribute('content', url + to.path);

  const existingLinks = document.querySelectorAll('link[rel="alternate"]');
  existingLinks.forEach((link) => link.parentNode?.removeChild(link));

  if (meta.availableLocales && !meta.skipSiteMap) {
    (<Array<string>>meta.availableLocales).forEach((language) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = language;
      link.href = url + localizedPath(to.path, language);
      document.head.appendChild(link);
    });

    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = 'x-default';
    link.href = url + basePath(to.path);
    document.head.appendChild(link);
  }
}

watch(i18n.global.locale, () => {
  if (router.currentRoute.value.matched.length && isNeutralPath(router.currentRoute.value.path)) {
    updateMetadata(router.currentRoute.value);
  }
});

export default router;
