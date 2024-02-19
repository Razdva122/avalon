import type { TRoomState } from '../room';
import type { IVisualGameState } from '../game/state';
import type { IGameOptions } from '../game/options';

import type { Server as SuperServer, Socket as SuperServerSocket } from 'socket.io';
import type { Socket as SuperSocket } from 'socket.io-client';
import type { TVoteOption } from '../game/vote';
import type { TMissionResult } from '../game/mission';
import type { TLoyalty } from '../game/roles';

import type { IRoomUnavailableError } from './errors';
import type { TAssassinateType } from '../game/addons';

export type { ISocketError } from './errors';

export interface ServerToClientEvents {
  roomUpdated: (state: TRoomState) => void;
  gameUpdated: (state: IVisualGameState) => void;
  restartGame: (uuid: string) => void;
  serverError: (error: string) => void;
}

export interface ClientToServerEvents {
  createRoom: (callback: (uuid: string) => void) => void;
  joinRoom: (uuid: string, callback: (state: TRoomState | IRoomUnavailableError) => void) => void;
  lockRoom: (uuid: string) => void;
  kickPlayer: (uuid: string, userID: string) => void;
  leaveRoom: (uuid: string) => void;

  joinGame: (uuid: string) => void;
  startGame: (uuid: string, options: IGameOptions) => void;
  leaveGame: (uuid: string) => void;
  restartGame: (uuid: string) => void;

  selectPlayer: (uuid: string, userID: string) => void;
  sentSelectedPlayers: (uuid: string) => void;
  voteForMission: (uuid: string, option: TVoteOption) => void;
  actionOnMission: (uuid: string, result: TMissionResult) => void;
  assassinate: (uuid: string, type: TAssassinateType) => void;

  checkLoyalty: (uuid: string) => void;
  getLoyalty: (uuid: string, callback: (loyalty: TLoyalty) => void) => void;
  announceLoyalty: (uuid: string, loualty: TLoyalty) => void;

  giveExcalibur: (uuid: string) => void;
  useExcalibur: (uuid: string) => void;
}

export type Server = SuperServer<ClientToServerEvents, ServerToClientEvents>;
export type Socket = SuperSocket<ServerToClientEvents, ClientToServerEvents>;
export type ServerSocket = SuperServerSocket<ClientToServerEvents, ServerToClientEvents>;
