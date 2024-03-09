import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { routesSeo } from '@/router/seo';
import Lobby from '@/pages/lobby/Lobby.vue';

export const routes: Array<RouteRecordRaw> = [
  { ...routesSeo.lobby, component: Lobby },
  { ...routesSeo.about, component: () => import('@/pages/about/About.vue') },
  { ...routesSeo.room, component: () => import('@/pages/room/Room.vue') },
  { ...routesSeo.wiki, component: () => import('@/pages/wiki/Index.vue') },
  { ...routesSeo.addons, component: () => import('@/pages/wiki/addons/Index.vue') },
  { ...routesSeo.lady, component: () => import('@/pages/wiki/addons/LadyOfTheLake.vue') },
  { ...routesSeo.excalibur, component: () => import('@/pages/wiki/addons/Excalibur.vue') },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

const defaultKeywords = ['The Resistance', 'Avalon', 'Online'];

router.beforeEach((to, from, next) => {
  const keywords = <string[]>to.meta.keywords;
  document.title = <string>to.meta.title;
  document.querySelector('head meta[name="description"]')!.setAttribute('content', <string>to.meta.description);
  document
    .querySelector('head meta[name="keywords"]')!
    .setAttribute('content', [...keywords, ...defaultKeywords].join(', '));
  next();
});

export default router;
