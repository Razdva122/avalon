import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, md } from 'vuetify/iconsets/md';
import { userInStorage } from '@/store/init';

import type { IUser } from '@/store/interface';

function selectTheme(): 'lightTheme' | 'darkTheme' {
  if (userInStorage) {
    const user: IUser = JSON.parse(userInStorage);

    return user.settings?.colorTheme === 'dark' ? 'darkTheme' : 'lightTheme';
  }

  return 'lightTheme';
}

const lightTheme = {
  dark: false,
  colors: {
    primary: '#1976D2',
    secondary: '#424242',
    accent: '#82B1FF',
    error: '#C8000F',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#fb8c00',
    bgApp: '#635f57',
    bgHeader: '#2c3e50',
  },
};

const darkTheme = {
  dark: true,
  colors: {
    primary: '#1976D2',
    secondary: '#424242',
    accent: '#82B1FF',
    error: '#C8000F',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#fb8c00',
    bgApp: '#1E1E1E',
    bgHeader: '#0D0D0D',
  },
};

export const vuetify = createVuetify({
  theme: {
    defaultTheme: selectTheme(),
    themes: {
      lightTheme,
      darkTheme,
    },
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
