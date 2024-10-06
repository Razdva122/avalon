import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, md } from 'vuetify/iconsets/md';

export const vuetify = createVuetify({
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
