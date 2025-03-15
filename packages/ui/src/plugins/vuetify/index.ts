import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, md } from 'vuetify/iconsets/md';
import { userSettingsInStorage } from '@/store/init';

import type { IUserSettings } from '@/store/interface';

function selectTheme(): 'lightTheme' | 'darkTheme' {
  if (userSettingsInStorage) {
    const settings: IUserSettings = JSON.parse(userSettingsInStorage);

    return settings.colorTheme === 'dark' ? 'darkTheme' : 'lightTheme';
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
    'text-primary': '#333333',
    'bg-app': '#CFD8DC',
    'bg-header': '#D1D5DB',
    inset: '#EFF2F5',
    'inset-reverted': '#262C36',
    'inset-hover': '#D1D9E0',
  },
  variables: {
    'icon-invert': 1,
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
    'bg-app': '#1E1E1E',
    'bg-header': '#0D0D0D',
    'text-primary': '#FFFFFF',
    inset: '#262C36',
    'inset-reverted': '#EFF2F5',
    'inset-hover': '#2A313C',
  },
  variables: {
    'icon-invert': 0,
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
      color: 'inset',
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
