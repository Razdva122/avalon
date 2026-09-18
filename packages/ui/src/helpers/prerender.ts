import { basePath } from '@/router/paths';

export const prerender = '__AVALON_PRERENDER__' in window;
export const article = /^\/(wiki(?:\/|$)|about(?:\/|$)|support(?:\/|$)|community(?:\/|$))/.test(
  basePath(window.location.pathname),
);
export const hydrateArticle =
  article && document.querySelector<HTMLElement>('#app')?.dataset.ssrPath === window.location.pathname;
