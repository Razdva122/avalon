export interface IState {
  user: IUser | null;
}

export interface IUser {
  id: string;
  name: string;
}
