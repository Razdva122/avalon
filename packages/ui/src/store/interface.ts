import type { Socket } from '@avalon/types';

export interface IState {
  user: IUser | null;
  socket: Socket;
  connect: boolean | null;
}

export interface IUser {
  id: string;
  name: string;
}
