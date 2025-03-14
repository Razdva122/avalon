import 'material-design-icons-iconfont/dist/material-design-icons.css';

import { createApp } from 'vue';

import App from '@/App.vue';
import router from '@/router';
import { store, key } from '@/store';

import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';

import { vuetify } from '@/plugins/vuetify';
import { i18n } from '@/plugins/i18n';

import '@/plugins/chart.js';

createApp(App)
  .component('LocalizedTextWrapper', LocalizedTextWrapper)
  .use(i18n)
  .use(store, key)
  .use(router)
  .use(vuetify)
  .mount('#app');
