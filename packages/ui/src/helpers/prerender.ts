import { basePath } from '@/router/paths';

export const prerender = '__AVALON_PRERENDER__' in window;
export const article = /^\/(wiki(?:\/|$)|about(?:\/|$)|support(?:\/|$)|community(?:\/|$))/.test(
  basePath(window.location.pathname),
);
// The lobby hero is prerendered too: remounting it replaces the already-painted
// LCP text when the application finishes loading.
export const ssrPage = article || basePath(window.location.pathname) === '/';
export const hydratePage =
  ssrPage && document.querySelector<HTMLElement>('#app')?.dataset.ssrPath === window.location.pathname;
