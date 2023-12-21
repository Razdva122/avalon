import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Lobby from '@/pages/lobby/Lobby.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'lobby',
    component: Lobby,
  },
  {
    path: '/room/:uuid',
    props: true,
    name: 'room',
    component: () => import('@/pages/room/Room.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
