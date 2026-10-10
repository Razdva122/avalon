import { index, prop } from '@typegoose/typegoose';

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

export type CodexSettings = { model: string; reasoning: string };
export type CodexModelOption = { id: string; label: string; efforts: string[] };

export type AiLanguage = 'en' | 'ru' | 'zh-tw';
export type AiPlayerCount = 5 | 6 | 7 | 8;

export type AiRoomState = {
  /** Single administrator seat; absent in spectator-only bot matches. */
  humanPlayerID?: string;
  waitingForHuman?: boolean;
  waitingForDiscussion?: boolean;
  discussionPending?: boolean;
  /** Missing in older archives; discussion defaults to English. */
  language?: AiLanguage;
  /** Missing in older archives; the saved player list still identifies the size. */
  playerCount?: AiPlayerCount;
  /** Only rooms created after the AI rating release participate in this season. */
  profileRatingSeason?: number;
  codex?: CodexSettings;
  /** Restored inference label for archives that predate saved Codex settings. */
  playedModel?: string;
  status: 'ready' | 'running' | 'paused' | 'finished' | 'stopped';
  /** The AI seat currently awaiting generation; cleared when idle or paused. */
  thinkingPlayerID?: string;
  canResumeTechnical?: boolean;
  /** Read-only compatibility with historical archives; no current paid provider. */
  costRub?: number;
  model?: string;
  fallbacks: number;
  message: string;
};

export { aiPlayedModel } from './ai-model';

export class BaseRoomState {
  public ai?: AiRoomState;
  // Response-only: archived games have no live room or voice conversation.
  public archived?: boolean;

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

@index({ roomID: 1 }, { unique: true })
@index({ 'players.id': 1, 'game.stage': 1, _id: 1 })
@index({ completionPending: 1, _id: 1 })
export class StartedRoomState extends BaseRoomState {
  @prop()
  public completionPending?: boolean;
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
  @prop()
  public requestID?: string;

  @prop()
  public id?: string;

  @prop()
  public kind?: 'text' | 'sticker';

  @prop()
  public stickerID?: string;

  @prop({ required: true })
  public userID!: string;

  @prop({ required: true })
  public message!: string;

  @prop({ required: true })
  public timestamp!: number;
}

export type ChatSendResult = { message: ChatMessage } | { error: 'invalidMessage' | 'notInRoom' | 'failed' };

export type TMessage = {
  id?: string;
  roomID?: string;
  text: string;
  author: string;
};

/** Short model-written explanation; only returned through the AI spectator endpoint. */
export type AiSpectatorDecision = {
  playerID: string;
  id: number;
  seat: string;
  mission: number;
  stage: string;
  choice: string;
  reason: string;
};

export interface CodexWeeklyLimit {
  shortTerm?: { remainingPercent: number; resetsAt: number | null };
  remainingPercent: number;
  resetsAt: number | null;
  checkedAt: number;
}
