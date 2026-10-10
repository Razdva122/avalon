import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, md } from 'vuetify/iconsets/md';
import { fa } from './icons';
import { hydratePage, ssrPage } from '@/helpers/prerender';
import { userSettingsInStorage } from '@/store/init';

import type { IUserSettings } from '@/store/interface';

function selectTheme(): 'lightTheme' | 'darkTheme' {
  if (!hydratePage && userSettingsInStorage) {
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

    primary: '#295F8F',
    'on-primary': '#FFFFFF',
    secondary: '#424242',
    accent: '#82B1FF',
    error: '#C8000F',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#fb8c00',
    'text-primary': '#25303D',
    background: '#F4F6F9',
    surface: '#FFFFFF',
    'on-surface': '#25303D',
    'bg-app': '#F4F6F9',
    'bg-header': '#FFFFFF',
    inset: '#FFFFFF',
    'inset-reverted': '#1C2532',
    'inset-hover': '#E9EEF4',
  },
  variables: {
    'icon-invert': 0,
    'holiday-background-opacity': 0.06,
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

    primary: '#98C8ED',
    'on-primary': '#142B40',
    secondary: '#424242',
    accent: '#82B1FF',
    error: '#C8000F',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#fb8c00',
    'bg-app': '#131923',
    'bg-header': '#18202C',
    'text-primary': '#E7EDF5',
    background: '#131923',
    surface: '#1C2532',
    'on-surface': '#E7EDF5',
    inset: '#1C2532',
    'inset-reverted': '#FFFFFF',
    'inset-hover': '#273448',
  },
  variables: {
    'icon-invert': 1,
    'holiday-background-opacity': 0.1,
  },
};

export const vuetify = createVuetify({
  ssr: ssrPage,
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
