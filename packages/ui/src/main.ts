import 'material-design-icons-iconfont/dist/material-design-icons.css';

import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';

import App from '@/App.vue';
import router from '@/router';
import { store, key } from '@/store';

import { selectLocale, translates } from '@/helpers/i18n';

import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, md } from 'vuetify/iconsets/md';

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
  },
  defaults: {
    VBtn: {
      color: 'primary',
      variants: 'tonal',
      rounded: 'lg',
    },
  },
  icons: {
    defaultSet: 'md',
    aliases,
    sets: {
      md,
    },
  },
});

const i18n = createI18n({
  locale: selectLocale(),
  fallbackLocale: 'en',
  messages: translates,
});

createApp(App).use(i18n).use(store, key).use(router).use(vuetify).mount('#app');
