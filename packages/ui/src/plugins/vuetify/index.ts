import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, md } from 'vuetify/iconsets/md';
import { fa } from './icons';
import { hydrateArticle, article } from '@/helpers/prerender';
import { userSettingsInStorage } from '@/store/init';

import type { IUserSettings } from '@/store/interface';

function selectTheme(): 'lightTheme' | 'darkTheme' {
  if (!hydrateArticle && userSettingsInStorage) {
    const settings: IUserSettings = JSON.parse(userSettingsInStorage);

    return settings.colorTheme === 'dark' ? 'darkTheme' : 'lightTheme';
  }

  return 'lightTheme';
}

const lightTheme = {
  dark: false,
  colors: {
    'support-surface': '#eceae3',
    'support-text': '#38362f',
    'support-muted': '#625c4e',
    'support-accent': '#825411',
    'support-border': '#c3b99f',
    'support-button': '#ded7c4',

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
    'icon-invert': 0,
  },
};

const darkTheme = {
  dark: true,
  colors: {
    'support-surface': '#292a28',
    'support-text': '#ede8dc',
    'support-muted': '#bdb7a9',
    'support-accent': '#f0c96d',
    'support-border': '#555044',
    'support-button': '#454034',

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
    'icon-invert': 1,
  },
};

export const vuetify = createVuetify({
  ssr: article,
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
      fa,
    },
  },
});
