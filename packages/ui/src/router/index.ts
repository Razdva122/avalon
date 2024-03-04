import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Lobby from '@/pages/lobby/Lobby.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'lobby',
    component: Lobby,
    meta: {
      title: 'Play Avalon Online!',
      description: "A free platform for playing the board game 'The Resistance: Avalon'",
    },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/pages/about/About.vue'),
    meta: {
      title: 'Avalon Game About',
      description:
        "Information about the web platform avalon-game.com. The rules of the board game 'The Resistance: Avalon'.",
    },
  },
  {
    path: '/room/:uuid',
    props: true,
    name: 'room',
    component: () => import('@/pages/room/Room.vue'),
    meta: {
      title: 'Avalon Game Room',
      description: "Rooms for online games in 'The Resistance: Avalon'",
    },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  document.title = <string>to.meta.title;
  document.querySelector('head meta[name="description"]')!.setAttribute('content', <string>to.meta.description);
  next();
});

export default router;
