import { prop } from '@typegoose/typegoose';

import { VisualGameState } from '../game/state';
import { GameOptions } from '../game/options';

export * from './list';

export type TRoomState = CreatedRoomState | LockedRoomState | StartedRoomState;

export type TVoteTarget = 'endGame' | 'endAndRestartGame';

export class VoteRoomResult {
  @prop({ required: true })
  public total!: number;

  @prop({ required: true })
  public yes!: number;

  @prop({ required: true })
  public no!: number;

  @prop({ required: true })
  public required!: number;
}

export class VoteInRoom {
  @prop({ required: true })
  public target!: TVoteTarget;

  @prop({ required: true, type: () => [VoteOfPlayer], _id: false })
  public votes!: VoteOfPlayer[];

  @prop({ required: true })
  public result!: VoteRoomResult;
}

export class BaseRoomState {
  @prop({ required: true })
  public stage!: 'created' | 'locked' | 'started';

  @prop({ required: true })
  public roomID!: string;

  @prop({ required: true })
  public leaderID!: string;

  @prop({ required: true })
  public createAt!: string;

  @prop({ required: true, type: () => [RoomPlayer], _id: false })
  public players!: RoomPlayer[];

  @prop({ _id: false })
  public vote?: VoteInRoom;

  @prop({ required: true, _id: false })
  public options!: GameOptions;

  @prop({ required: true, type: () => [ChatMessage], _id: false })
  public chat!: ChatMessage[];
}

export class CreatedRoomState extends BaseRoomState {
  declare stage: 'created';
}

export class LockedRoomState extends BaseRoomState {
  declare stage: 'locked';
}

export class StartedRoomState extends BaseRoomState {
  declare stage: 'started';

  @prop({ required: true })
  public startAt!: string;

  @prop({ required: true, _id: false })
  public game!: VisualGameState;
}

export class User {
  @prop({ required: true })
  public id!: string;
}

export class RoomPlayer extends User {
  @prop({ required: true })
  isLeader!: boolean;
}

export class VoteOfPlayer extends RoomPlayer {
  @prop()
  voteResult?: boolean;
}

export class ChatMessage {
  @prop({ required: true })
  public userID!: string;

  @prop({ required: true })
  public message!: string;

  @prop({ required: true })
  public timestamp!: number;
}

export type TMessage = {
  text: string;
  author: string;
};
