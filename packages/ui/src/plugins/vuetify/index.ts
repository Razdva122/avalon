import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { watch } from 'vue';
import { aliases, md } from 'vuetify/iconsets/md';
import { fa } from './icons';
import { i18n } from '@/plugins/i18n';
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
    'history-for': '#2196F3',
    'history-against': '#fb8c00',
    'history-card-success': '#4CAF50',
    'history-card-fail': '#C8000F',
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
    'history-for-opacity': 0.07,
    'history-against-opacity': 0.09,
    'history-card-fail-border-opacity': 0.45,
    'history-focus-width': '2px',
    'history-focus-opacity': 1,
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
    'history-for': '#7F9EB7',
    'history-against': '#B39A73',
    'history-card-success': '#82AC90',
    'history-card-fail': '#CD9392',
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
    'history-for-opacity': 0.045,
    'history-against-opacity': 0.04,
    'history-card-fail-border-opacity': 0.65,
    'history-focus-width': '1px',
    'history-focus-opacity': 0.65,
  },
};

export const vuetify = createVuetify({
  ssr: ssrPage,
  locale: {
    locale: 'en',
    fallback: 'en',
  },
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

let vietnamese: Promise<typeof import('./vi')> | undefined;
export async function syncVuetifyLanguage() {
  const language = i18n.global.locale.value;
  if (language === 'vi') {
    const messages = await (vietnamese ??= import(/* webpackChunkName: "vuetify-vi" */ './vi').catch((error) => {
      vietnamese = undefined;
      throw error;
    }));
    vuetify.locale.messages.value.vi = messages.default;
  }
  // A slower language download cannot replace a newer selection.
  if (i18n.global.locale.value === language) vuetify.locale.current.value = language === 'vi' ? 'vi' : 'en';
}
watch(i18n.global.locale, () => {
  void syncVuetifyLanguage().catch(() => console.error('Framework language could not be loaded'));
});
