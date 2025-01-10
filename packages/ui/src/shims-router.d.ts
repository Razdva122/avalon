import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $route: RouteLocationNormalizedLoaded;
    $router: Router;
  }
}
