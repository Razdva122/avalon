import type { IVisualGameState } from '../game/state';

export * from './list';

export type TRoomState = TCreatedRoomState | TLockedRoomState | TStartedRoomState;

export type TVoteTarget = 'endGame' | 'endAndRestartGame';

export type TVoteInRoom = {
  target: TVoteTarget;
  text: string;
  votes: (TRoomPlayer & { voteResult?: boolean })[];
  result: {
    total: number;
    yes: number;
    no: number;
    required: number;
  };
};

type TMetaRoomState = {
  roomID: string;
  leaderID: string;
  players: TRoomPlayer[];
  vote?: TVoteInRoom;
};

export type TRoomPlayer = {
  id: string;
  name: string;
  isLeader: boolean;
};

export type TCreatedRoomState = {
  stage: 'created';
} & TMetaRoomState;

export type TLockedRoomState = {
  stage: 'locked';
} & TMetaRoomState;

export type TStartedRoomState = {
  stage: 'started';
  game: IVisualGameState;
} & TMetaRoomState;
