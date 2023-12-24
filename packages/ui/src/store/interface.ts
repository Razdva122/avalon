export interface IState {
  user: IUser | null;
  connect: boolean | null;
}

export interface IUser {
  id: string;
  name: string;
}
