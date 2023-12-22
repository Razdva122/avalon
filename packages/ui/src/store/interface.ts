import type { Socket } from 'socket.io-client';

export interface IState {
  user: IUser | null;
  socket: Socket;
  connect: boolean | null;
}

export interface IUser {
  id: string;
  name: string;
}
