import type { Router } from 'vue-router';

export async function openRoomRoute(router: Router, uuid: string, isActive: () => boolean): Promise<boolean> {
  if (!isActive()) return false;
  const removeGuard = router.beforeResolve((to) => {
    if (to.name === 'room' && to.params.uuid === uuid && !isActive()) return false;
  });
  try {
    const failure = await router.push({ name: 'room', params: { uuid } });
    return !failure && isActive();
  } finally {
    removeGuard();
  }
}
