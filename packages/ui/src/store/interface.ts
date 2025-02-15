import type { TLanguage } from '@/helpers/i18n';

export interface IState {
  user: IUser | null;
  hideSpoilers: boolean;
  connect: boolean | null;
  alerts: TAlerts;
}

export interface IUser {
  id: string;
  name: string;
  settings?: {
    locale?: { value: TLanguage; isDefault: boolean };
    hideIndexInHistory?: boolean;
    colorTheme?: 'light' | 'dark';
    style?: 'default' | 'anime';
  };
}

export type TAlerts = {
  [key in TAlertsName]?: number;
};

export type TAlertsName = 'discord';
