export interface IState {
  user: IUser | null;
  hideSpoilers: boolean;
  connect: boolean | null;
  alerts: TAlerts;
}

export interface IUser {
  id: string;
  name: string;
}

export type TAlerts = {
  [key in TAlertsName]?: number;
};

export type TAlertsName = 'newbie' | 'discord';
