import type { TLanguage } from '@/helpers/i18n';

export interface IState {
  profile: IUserProfile | null;
  settings: IUserSettings | null;
  hideSpoilers: boolean;
  connect: boolean | null;
  alerts: TAlerts;
}

export interface IUserProfile {
  id: string;
  name: string;
  token: string;
  email: string;
  login: string;
  avatar: string;
}

export interface IUserSettings {
  locale?: { value: TLanguage; isDefault: boolean };
  hideIndexInHistory?: boolean;
  colorTheme?: 'light' | 'dark';
  style?: 'default' | 'anime';
}

export type TAlerts = {
  [key in TAlertsName]?: number;
};

export type TAlertsName = 'discord';
