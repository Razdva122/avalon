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

import type { TRoomsList } from '../room';

export type { ISocketError } from './errors';

export interface ServerToClientEvents {
  roomsListUpdated: (list: TRoomsList) => void;
  roomUpdated: (state: TRoomState) => void;
  gameUpdated: (state: IVisualGameState) => void;
  restartGame: (uuid: string) => void;
  serverError: (error: string) => void;
}

export interface ClientToServerEvents {
  getRoomsList: (callback: (list: TRoomsList) => void) => void;

  createRoom: (callback: (uuid: string) => void) => void;
  updateOptions: (uuid: string, options: IGameOptions) => void;
  joinRoom: (uuid: string, callback: (state: TRoomState | IRoomUnavailableError) => void) => void;
  sendMessage: (uuid: string, message: string) => void;
  lockRoom: (uuid: string) => void;
  kickPlayer: (uuid: string, userID: string) => void;
  leaveRoom: (uuid: string) => void;

  endGame: (uuid: string) => void;
  endAndRestartGame: (uuid: string) => void;
  shuffle: (uuid: string) => void;
  voteInRoom: (uuid: string, result: boolean) => void;

  joinGame: (uuid: string) => void;
  startGame: (uuid: string) => void;
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

  useWitchAbility: (uuid: string, result: boolean) => void;
}

export type Server = SuperServer<ClientToServerEvents, ServerToClientEvents>;
export type Socket = SuperSocket<ServerToClientEvents, ClientToServerEvents>;
export type ServerSocket = SuperServerSocket<ClientToServerEvents, ServerToClientEvents>;
