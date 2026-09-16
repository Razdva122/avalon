import 'material-design-icons-iconfont/dist/material-design-icons.css';

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
import { prerender, article, hydrateArticle } from '@/helpers/prerender';
import { userSettingsInStorage } from '@/store/init';

const root = document.querySelector<HTMLElement>('#app')!;
const app = (hydrateArticle || (prerender && article) ? createSSRApp : createApp)(App)
  .component('LocalizedTextWrapper', LocalizedTextWrapper)
  .component('LocaleLink', LocaleLink)
  .use(i18n)
  .use(store, key)
  .use(router)
  .use(vuetify);

async function start() {
  await router.isReady();
  if (prerender && article) {
    const { prerenderArticle } = await import('@/helpers/prerender-article');
    await prerenderArticle(app, root);
  } else {
    app.mount(root);
    if (hydrateArticle) {
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
}

// A neutral URL receives a lobby shell, which must not be mistaken for room content.
if (isNeutralPath(window.location.pathname)) root.replaceChildren();
void start().catch((error: Error) => {
  if (prerender) root.dataset.prerenderError = error.message;
  console.error(error);
});
