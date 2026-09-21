import '@/styles/material-icons.css';

import { createApp, createSSRApp, nextTick } from 'vue';

import App from '@/App.vue';
import router from '@/router';
import { store, key } from '@/store';

import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';

import { vuetify } from '@/plugins/vuetify';
import { i18n } from '@/plugins/i18n';

import LocaleLink from '@/components/feedback/LocaleLink.vue';
import { isNeutralPath } from '@/router/paths';
import { socket } from '@/api/socket';
import { prerender, ssrPage, hydratePage } from '@/helpers/prerender';
import { userSettingsInStorage } from '@/store/init';
import { fullStylesReady } from '@/helpers/critical-css';

const root = document.querySelector<HTMLElement>('#app')!;
const app = (hydratePage || (prerender && ssrPage) ? createSSRApp : createApp)(App)
  .component('LocalizedTextWrapper', LocalizedTextWrapper)
  .component('LocaleLink', LocaleLink)
  .use(i18n)
  .use(store, key)
  .use(router)
  .use(vuetify);

async function start() {
  await Promise.all([router.isReady(), fullStylesReady()]);
  if (prerender) {
    // Capture runtime dependencies BEFORE importing the build-only SSR renderer.
    // Publishing its chunks as preloads would make visitors download the renderer.
    for (const resource of performance.getEntriesByType('resource')) {
      const url = new URL(resource.name);
      if (url.origin !== location.origin || !/^\/js\/[^/]+\.js$/.test(url.pathname)) continue;
      if (document.querySelector(`script[defer][src="${url.pathname}"], link[rel="preload"][href="${url.pathname}"]`))
        continue;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = url.pathname;
      document.head.appendChild(link);
    }
  }
  if (prerender && ssrPage) {
    const { prerenderPage } = await import('@/helpers/prerender-page');
    await prerenderPage(app, root);
  } else {
    app.mount(root);
    if (hydratePage) {
      // Hydrate the anonymous/default build state first, then apply the user's
      // settings reactively so Vue patches theme/icon classes as well as text.
      store.commit('restoreClientPreferences');
      const settings = userSettingsInStorage ? JSON.parse(userSettingsInStorage) : null;
      vuetify.theme.global.name.value = settings?.colorTheme === 'dark' ? 'darkTheme' : 'lightTheme';
    }
    if (!prerender) socket.connect();
  }
  await nextTick();
  if (prerender) root.dataset.prerenderReady = 'true';
  else window.dispatchEvent(new Event('avalon:ready'));
}

// A neutral URL receives a lobby shell, which must not be mistaken for room content.
if (isNeutralPath(window.location.pathname)) root.replaceChildren();
void start().catch((error: Error) => {
  if (prerender) root.dataset.prerenderError = error.message;
  console.error(error);
});
