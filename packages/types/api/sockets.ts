import type { TRoomState } from '../room';
import type { IVisualGameState } from '../game/state';

import type { Server as SuperServer, Socket as SuperServerSocket } from 'socket.io';
import type { Socket as SuperSocket } from 'socket.io-client';

export interface ServerToClientEvents {
  roomUpdated: (state: TRoomState) => void;
  gameUpdated: (state: IVisualGameState) => void;
  serverError: (error: string) => void;
}

export interface ClientToServerEvents {
  createRoom: (callback: (uuid: string) => void) => void;
  joinRoom: (uuid: string, callback: (state: TRoomState) => void) => void;
  lockRoom: (uuid: string) => void;
  joinGame: (uuid: string) => void;
  startGame: (uuid: string) => void;
  leaveGame: (uuid: string) => void;
  leaveRoom: (uuid: string) => void;
}

export type Server = SuperServer<ClientToServerEvents, ServerToClientEvents>;
export type Socket = SuperSocket<ServerToClientEvents, ClientToServerEvents>;
export type ServerSocket = SuperServerSocket<ClientToServerEvents, ServerToClientEvents>;
