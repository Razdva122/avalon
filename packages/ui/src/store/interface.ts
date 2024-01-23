export interface IState {
  user: IUser | null;
  hideSpoilers: boolean;
  connect: boolean | null;
}

export interface IUser {
  id: string;
  name: string;
}
