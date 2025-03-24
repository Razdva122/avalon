import type { TRoomState } from '../room';
import type { VisualGameState } from '../game/state';
import type { GameOptions } from '../game/options';

import type { Server as SuperServer, Socket as SuperServerSocket } from 'socket.io';
import type { Socket as SuperSocket } from 'socket.io-client';
import type { TVoteOption } from '../game/vote';
import type { TMissionResult } from '../game/mission';
import type { TLoyalty, TRoles } from '../game/roles';
import type { TLoyaltyType } from '../game/addons/loyalty';

import type {
  IRoomUnavailableError,
  ILoginError,
  IRegisterError,
  IUpdateEmailError,
  IUpdatePasswordError,
  IUpdateLoginError,
  IUpdateAvatarError,
} from './errors';
import type { TAssassinateType } from '../game/addons';

import type { TRoomsList, TMessage } from '../room';
import { TTotalWinrateStats } from '../stats';
import { UserForUI, UserProfile, IAvatarInfo, PublicUserProfile, UserWithToken } from '../user';

export type {
  ISocketError,
  ILoginError,
  IRegisterError,
  IUpdateEmailError,
  IUpdatePasswordError,
  IUpdateLoginError,
  IUpdateAvatarError,
} from './errors';
export type { ArgumentOfCallback } from './helpers';

export interface ServerToClientEvents {
  roomsListUpdated: (list: TRoomsList) => void;
  onlineCounterUpdated: (counter: number) => void;
  roomOnlineUpdated: (counter: number) => void;
  roomUpdated: (state: TRoomState) => void;
  gameUpdated: (state: VisualGameState) => void;
  newMessage: (message: TMessage) => void;
  restartGame: (uuid: string) => void;
  destroyRoom: (uuid: string) => void;
  serverError: (error: string) => void;
  renewJWT: () => void;
}

export interface ClientToServerUserEvents {
  registerUser: (
    user: Omit<UserProfile, 'avatar' | 'registrationDate'>,
    callback: (user: UserWithToken | IRegisterError) => void,
  ) => void;
  updateUserName: (name: string) => void;
  updateUserEmail: (password: string, email: string, callback: (result: true | IUpdateEmailError) => void) => void;
  updateUserLogin: (password: string, login: string, callback: (result: true | IUpdateLoginError) => void) => void;
  updateUserPassword: (
    password: string,
    newPassword: string,
    callback: (result: true | IUpdatePasswordError) => void,
  ) => void;
  updateUserAvatar: (avatarID: string, callback: (result: true | IUpdateAvatarError) => void) => void;
  login: (loginOrEmail: string, password: string, callback: (user: UserWithToken | ILoginError) => void) => void;
  getUserAvatars: (callback: (avatars: IAvatarInfo[]) => void) => void;
  getMyProfile: (callback: (user: UserForUI) => void) => void;
  revealEasterEgg: () => void;
}

export interface ClientToServerEvents extends ClientToServerUserEvents {
  getTotalStats: (callback: (stats: TTotalWinrateStats) => void) => void;
  getPlayerGames: (uuid: string, callback: (games: VisualGameState[]) => void) => void;
  getRoomsList: (callback: (list: TRoomsList) => void) => void;
  getOnlineCounter: (id: string, callback: (counter: number) => void) => void;
  getUserProfile: (id: string, callback: (user: PublicUserProfile) => void) => void;

  createRoom: (callback: (uuid: string) => void) => void;
  updateOptions: (uuid: string, options: GameOptions) => void;
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
  assassinate: (uuid: string, type: TAssassinateType, role?: TRoles) => void;

  checkLoyalty: (uuid: string) => void;
  getLoyalty: (uuid: string, type: TLoyaltyType, callback: (loyalty: TLoyalty | TRoles) => void) => void;
  announceLoyalty: (uuid: string, loyalty: TLoyalty | TRoles, type: TLoyaltyType) => void;

  giveExcalibur: (uuid: string) => void;
  useExcalibur: (uuid: string) => void;

  useWitchAbility: (uuid: string, result: boolean) => void;
  givePlotCard: (uuid: string) => void;
}

export type Server = SuperServer<ClientToServerEvents, ServerToClientEvents>;
export type Socket = SuperSocket<ServerToClientEvents, ClientToServerEvents>;
export type ServerSocket = SuperServerSocket<ClientToServerEvents, ServerToClientEvents>;
