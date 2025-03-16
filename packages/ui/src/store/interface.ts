import type { TLanguage } from '@/helpers/i18n';
import type { UserWithToken, PublicUserProfile, Dictionary } from '@avalon/types';

export interface IState {
  profile: UserWithToken | null;
  users: Dictionary<TUserState>;
  settings: IUserSettings | null;
  hideSpoilers: boolean;
  connect: boolean | null;
  alerts: TAlerts;
}

export type TUserState =
  | {
      status: 'loading';
    }
  | {
      status: 'ready';
      profile: PublicUserProfile;
    };

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
