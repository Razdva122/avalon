import type { TRoomState } from '../room';
import type { VisualGameState } from '../game/state';
import type { GameOptions } from '../game/options';

import type { Server as SuperServer, Socket as SuperServerSocket } from 'socket.io';
import type { Socket as SuperSocket } from 'socket.io-client';
import type { TVoteOption } from '../game/vote';
import type { TMissionResult } from '../game/mission';
import type { TLoyalty, TRoles } from '../game/roles';
import type { TrueSkillSocketEvents } from './trueskill-sockets';

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
import { TTotalWinrateStats, RoleRating, Achievement, UserAchievement, AchievementStats } from '../stats';
import { UserForUI, UserProfile, IAvatarInfo, PublicUserProfile, UserWithToken } from '../user';

export interface AchievementResponse {
  success: boolean;
  achievements?: Achievement[];
  userAchievements?: UserAchievement[];
  stats?: AchievementStats[];
  error?: string;
}

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
  achievementUnlocked: (achievementId: string) => void;
  achievementProgress: (data: { achievementID: string; currentProgress: number; requirement: number }) => void;
  hiddenAchievementsList: (achievements: string[]) => void;
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

export interface ClientToServerEvents extends ClientToServerUserEvents, TrueSkillSocketEvents {
  getTotalStats: (callback: (stats: TTotalWinrateStats) => void) => void;
  getPlayerGames: (uuid: string, callback: (games: VisualGameState[]) => void) => void;
  getRoomsList: (callback: (list: TRoomsList) => void) => void;
  getOnlineCounter: (id: string, callback: (counter: number) => void) => void;
  getUserProfile: (id: string, callback: (user: PublicUserProfile) => void) => void;

  // Rating system endpoints
  getRolesWithRatings: (callback: (roles: TRoles[] | { error: string }) => void) => void;
  getRoleLeaderboard: (role: TRoles, callback: (leaderboard: RoleRating[] | { error: string }) => void) => void;
  getUserRatings: (userID: string, callback: (ratings: RoleRating[] | { error: string }) => void) => void;
  getPopularRoles: (
    minPlayers: number,
    callback: (roles: { role: TRoles; playerCount: number }[] | { error: string }) => void,
  ) => void;
  getTopPlayersForPopularRoles: (
    minPlayers: number,
    callback: (result: { role: TRoles; topPlayer: RoleRating | null }[] | { error: string }) => void,
  ) => void;
  getRatingHistory: (
    userID: string,
    role: TRoles,
    callback: (history: { date: Date; rating: number | null; rank: number | null }[] | { error: string }) => void,
  ) => void;

  // Achievement system endpoints
  getAllAchievements: (callback: (response: AchievementResponse) => void) => void;
  getUserAchievements: (userID: string, callback: (response: AchievementResponse) => void) => void;
  getAchievementStats: (callback: (response: AchievementResponse) => void) => void;

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

  checkLoyalty: (uuid: string, cardID?: string) => void;
  checkLoyaltyWithCard: (uuid: string, cardID: string) => void;
  revealLoyalty: (uuid: string, cardID?: string) => void;
  revealLoyaltyWithCard: (uuid: string, cardID: string) => void;
  getLoyalty: (uuid: string, callback: (loyalty: TLoyalty | TRoles) => void) => void;
  getLoyaltyWithCard: (uuid: string, cardID: string, callback: (loyalty: TLoyalty | TRoles) => void) => void;
  announceLoyalty: (uuid: string, loyalty: TLoyalty | TRoles) => void;
  announceLoyaltyWithCard: (uuid: string, loyalty: TLoyalty | TRoles, cardID: string) => void;

  giveExcalibur: (uuid: string) => void;
  useExcalibur: (uuid: string) => void;

  useWitchAbility: (uuid: string, result: boolean) => void;

  givePlotCard: (uuid: string) => void;
  preVote: (uuid: string, option: TVoteOption, cardID: string) => void;
  useLeadToVictory: (uuid: string, use: boolean, cardID: string) => void;
  useAmbush: (uuid: string, cardID: string) => void;
  useRestoreHonor: (uuid: string, restoreHonorCardID: string, cardID: string) => void;
  useKingReturns: (uuid: string, use: boolean, cardID: string) => void;
  useWeFoundYou: (uuid: string, use: boolean, cardID: string) => void;
}

export type Server = SuperServer<ClientToServerEvents, ServerToClientEvents>;
export type Socket = SuperSocket<ServerToClientEvents, ClientToServerEvents>;
export type ServerSocket = SuperServerSocket<ClientToServerEvents, ServerToClientEvents>;
