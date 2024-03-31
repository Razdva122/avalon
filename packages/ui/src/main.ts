import 'material-design-icons-iconfont/dist/material-design-icons.css';

import { createApp } from 'vue';
import App from '@/App.vue';
import router from '@/router';
import { store, key } from '@/store';

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

createApp(App).use(store, key).use(router).use(vuetify).mount('#app');
