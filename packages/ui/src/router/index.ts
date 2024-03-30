import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { routesSeo } from '@/router/seo';
import Lobby from '@/pages/lobby/Lobby.vue';

export const routes: Array<RouteRecordRaw> = [
  { ...routesSeo.lobby, component: Lobby },
  { ...routesSeo.about, component: () => import('@/pages/about/About.vue') },
  { ...routesSeo.room, component: () => import('@/pages/room/Room.vue') },
  { ...routesSeo.wiki, component: () => import('@/pages/wiki/Index.vue') },
  { ...routesSeo.rules, component: () => import('@/pages/wiki/Rules.vue') },
  { ...routesSeo.addons, component: () => import('@/pages/wiki/addons/Index.vue') },
  { ...routesSeo.roles, component: () => import('@/pages/wiki/roles/Index.vue') },
  { ...routesSeo.lady, component: () => import('@/pages/wiki/addons/LadyOfTheLake.vue') },
  { ...routesSeo.excalibur, component: () => import('@/pages/wiki/addons/Excalibur.vue') },
  { ...routesSeo.merlin, component: () => import('@/pages/wiki/roles/Merlin.vue') },
  { ...routesSeo['merlin_pure'], component: () => import('@/pages/wiki/roles/MerlinPure.vue') },
  { ...routesSeo.percival, component: () => import('@/pages/wiki/roles/Percival.vue') },
  { ...routesSeo.lancelots, component: () => import('@/pages/wiki/roles/Lancelots.vue') },
  { ...routesSeo.lovers, component: () => import('@/pages/wiki/roles/Lovers.vue') },
  { ...routesSeo.servant, component: () => import('@/pages/wiki/roles/Servant.vue') },
  { ...routesSeo.morgana, component: () => import('@/pages/wiki/roles/Morgana.vue') },
  { ...routesSeo.mordred, component: () => import('@/pages/wiki/roles/Mordred.vue') },
  { ...routesSeo.oberon, component: () => import('@/pages/wiki/roles/Oberon.vue') },
  { ...routesSeo.minion, component: () => import('@/pages/wiki/roles/Minion.vue') },
  { ...routesSeo.notFound, component: () => import('@/pages/empty/NotFound.vue') },
  { path: '/isolde/', name: 'isolde', redirect: { name: 'lovers' } },
  { path: '/tristan/', name: 'tristan', redirect: { name: 'lovers' } },
  { path: '/evil_lancelot/', name: 'evil_lancelot', redirect: { name: 'lancelots' } },
  { path: '/good_lancelot/', name: 'good_lancelot', redirect: { name: 'lancelots' } },
  { path: '/:catchAll(.*)', redirect: '404' },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

const defaultKeywords = ['The Resistance', 'Avalon', 'Online'];

router.beforeEach((to, from, next) => {
  const keywords = <string[]>to.meta.keywords ?? [];
  const siteAdress = 'https://avalon-game.com';

  document.title = <string>to.meta.title;
  document.querySelector('head meta[name="description"]')!.setAttribute('content', <string>to.meta.description);
  document
    .querySelector('head meta[name="keywords"]')!
    .setAttribute('content', [...keywords, ...defaultKeywords].join(', '));

  document.querySelector('link[rel="canonical"]')!.setAttribute('href', siteAdress + to.path);

  next();
});

export default router;
