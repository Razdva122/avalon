import { prop } from '@typegoose/typegoose';

import type { VisualGameState } from '../game/state';
import type { GameOptions } from '../game/options';

export * from './list';

export type TRoomState = TCreatedRoomState | TLockedRoomState | TStartedRoomState;

export type TVoteTarget = 'endGame' | 'endAndRestartGame';

export type TVoteInRoom = {
  target: TVoteTarget;
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
  options: GameOptions;
  chat: ChatMessage[];
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
  game: VisualGameState;
} & TMetaRoomState;

export class User {
  @prop({ required: true, unique: true })
  public id!: string;

  @prop({ required: true })
  public name!: string;
}

export class ChatMessage {
  @prop({ required: true })
  public user!: User;

  @prop({ required: true })
  public message!: string;

  @prop({ required: true })
  public timestamp!: number;
}

export type TMessage = {
  text: string;
  author: string;
};
