import type { TRoomState } from '../room';
import type { IVisualGameState } from '../game/state';

import type { Server as SuperServer, Socket as SuperServerSocket } from 'socket.io';
import type { Socket as SuperSocket } from 'socket.io-client';
import type { TVoteOption } from '../game/vote';
import { TMissionResult } from '../game/mission';

export interface ServerToClientEvents {
  roomUpdated: (state: TRoomState) => void;
  gameUpdated: (state: IVisualGameState) => void;
  serverError: (error: string) => void;
}

export interface ClientToServerEvents {
  createRoom: (callback: (uuid: string) => void) => void;
  joinRoom: (uuid: string, callback: (state: TRoomState) => void) => void;
  lockRoom: (uuid: string) => void;
  leaveRoom: (uuid: string) => void;

  joinGame: (uuid: string) => void;
  startGame: (uuid: string) => void;
  leaveGame: (uuid: string) => void;

  selectPlayer: (uuid: string, userID: string) => void;
  sentSelectedPlayers: (uuid: string) => void;
  voteForMission: (uuid: string, option: TVoteOption) => void;
  actionOnMission: (uuid: string, result: TMissionResult) => void;
  selectMerlin: (uuid: string) => void;
}

export type Server = SuperServer<ClientToServerEvents, ServerToClientEvents>;
export type Socket = SuperSocket<ServerToClientEvents, ClientToServerEvents>;
export type ServerSocket = SuperServerSocket<ClientToServerEvents, ServerToClientEvents>;
