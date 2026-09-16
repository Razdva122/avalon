import 'material-design-icons-iconfont/dist/material-design-icons.css';

import { createApp } from 'vue';

import App from '@/App.vue';
import router from '@/router';
import { store, key } from '@/store';

import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';

import { vuetify } from '@/plugins/vuetify';
import { i18n } from '@/plugins/i18n';

import LocaleLink from '@/components/feedback/LocaleLink.vue';
import { isNeutralPath } from '@/router/paths';

const app = createApp(App)
  .component('LocalizedTextWrapper', LocalizedTextWrapper)
  .component('LocaleLink', LocaleLink)
  .use(i18n)
  .use(store, key)
  .use(router)
  .use(vuetify);

// Keep prerendered content visible while the initial route chunk is loading.
// Mounting earlier would clear it and show an empty RouterView.
if (isNeutralPath(window.location.pathname)) {
  // Private routes receive the lobby shell from nginx, not prerendered room content.
  app.mount('#app');
} else {
  router.isReady().then(() => app.mount('#app'));
}
