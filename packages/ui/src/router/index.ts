import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { routesSeo } from '@/router/seo';
import Lobby from '@/pages/lobby/Lobby.vue';

export const routes: Array<RouteRecordRaw> = [
  { ...routesSeo.lobby, component: Lobby },
  { ...routesSeo.about, component: () => import('@/pages/about/About.vue') },
  { ...routesSeo.room, component: () => import('@/pages/room/Room.vue') },
  { ...routesSeo.wiki, component: () => import('@/pages/wiki/Index.vue') },
  { ...routesSeo.addons, component: () => import('@/pages/wiki/addons/Index.vue') },
  { ...routesSeo.roles, component: () => import('@/pages/wiki/roles/Index.vue') },
  { ...routesSeo.lady, component: () => import('@/pages/wiki/addons/LadyOfTheLake.vue') },
  { ...routesSeo.excalibur, component: () => import('@/pages/wiki/addons/Excalibur.vue') },
  { ...routesSeo.merlin, component: () => import('@/pages/wiki/roles/Merlin.vue') },
  { ...routesSeo.percival, component: () => import('@/pages/wiki/roles/Percival.vue') },
  { ...routesSeo.notFound, component: () => import('@/pages/empty/NotFound.vue') },
  { path: '/:catchAll(.*)', redirect: '404' },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

const defaultKeywords = ['The Resistance', 'Avalon', 'Online'];

router.beforeEach((to, from, next) => {
  const keywords = <string[]>to.meta.keywords ?? [];
  document.title = <string>to.meta.title;
  document.querySelector('head meta[name="description"]')!.setAttribute('content', <string>to.meta.description);
  document
    .querySelector('head meta[name="keywords"]')!
    .setAttribute('content', [...keywords, ...defaultKeywords].join(', '));
  next();
});

export default router;
