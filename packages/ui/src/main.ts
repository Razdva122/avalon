import 'material-design-icons-iconfont/dist/material-design-icons.css';

import { createApp } from 'vue';

import App from '@/App.vue';
import router from '@/router';
import { store, key } from '@/store';

import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';

import { vuetify } from '@/plugins/vuetify';
import { i18n } from '@/plugins/i18n';

import LocaleLink from '@/components/feedback/LocaleLink.vue';

createApp(App)
  .component('LocalizedTextWrapper', LocalizedTextWrapper)
  .component('LocaleLink', LocaleLink)
  .use(i18n)
  .use(store, key)
  .use(router)
  .use(vuetify)
  .mount('#app');
