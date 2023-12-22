import { createApp } from 'vue';
import App from '@/App.vue';
import router from '@/router';
import { store, key } from '@/store';

import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
  },
});

createApp(App).use(store, key).use(router).use(vuetify).mount('#app');
