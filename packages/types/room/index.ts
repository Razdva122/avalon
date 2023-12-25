import type { IVisualGameState } from '../game/state';

export type TRoomState = TCreatedRoomState | TLockedRoomState | TStartedRoomState | TUnavailableState;
export type TAvailableRoom = Exclude<TRoomState, TUnavailableState>;

type TMetaRoomState = {
  roomID: string;
  leaderID: string;
  players: TRoomPlayer[];
};

export type TRoomPlayer = {
  id: string;
  name: string;
};

export type TCreatedRoomState = {
  stage: 'created';
} & TMetaRoomState;

export type TLockedRoomState = {
  stage: 'locked';
} & TMetaRoomState;

export type TUnavailableState = {
  stage: 'unavailable';
};

export type TStartedRoomState = {
  stage: 'started';
  game: IVisualGameState;
} & TMetaRoomState;
