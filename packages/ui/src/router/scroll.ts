import type { RouterScrollBehavior } from 'vue-router';

export const scrollBehavior: RouterScrollBehavior = (to, _from, savedPosition) => {
  if (savedPosition) return savedPosition;
  if (to.hash) return { el: to.hash, top: 80 };
  return { top: 0 };
};
