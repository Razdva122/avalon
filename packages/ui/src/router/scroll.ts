import type { RouterScrollBehavior } from 'vue-router';

export const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) => {
  if (savedPosition) return savedPosition;
  if (to.hash) return { el: to.hash, top: 80 };
  if (to.path && to.path === from.path && /\/community\/(?:players|groups)\/$/.test(to.path)) {
    if (to.query.page !== from.query.page) return { el: '#player-boards', top: 80 };
    return false;
  }
  return { top: 0 };
};
