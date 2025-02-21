import { prop } from '@typegoose/typegoose';
import { Schema } from 'mongoose';

import { Player } from './player';
import { MissionWithResult } from './mission';
import {
  HistoryBase,
  HistoryAssassinate,
  CheckLoyalty,
  SwitchResult,
  HiddenHistory,
  SwitchLancelots,
  HistoryVoteBase,
  HistoryMissionBase,
} from './history';
import type { THistoryResults } from './history';
import type { GameSettingsWithRoles } from './settings';
import type { TAddonsStages, AddonsData } from './addons';
import type { TLoyalty } from '../game/roles';
import type { GameOptionsFeatures } from '../game/options';
import type { Dictionary } from '../utils';

export class GameResults {
  @prop()
  winner?: TLoyalty;

  @prop({ required: true })
  reason!: TGameEndReasons;
}

export class VisualGameState {
  @prop()
  public result?: GameResults;

  @prop({ unique: true, required: true })
  public uuid!: string;

  @prop({ required: true })
  public stage!: string;

  @prop({ required: true })
  public vote!: number;

  @prop({ required: true })
  public mission!: number;

  @prop({ required: true, type: () => [MissionWithResult] })
  public missionState!: MissionWithResult[];

  @prop({ required: true })
  public settings!: GameSettingsWithRoles;

  @prop({
    type: () => [HistoryBase],
    discriminators: () => [
      { type: HistoryVoteBase },
      { type: HistoryMissionBase },
      { type: HistoryAssassinate },
      { type: CheckLoyalty },
      { type: SwitchResult },
      { type: HiddenHistory },
      { type: SwitchLancelots },
    ],
    _id: false,
  })
  public history!: THistoryResults[];

  @prop({ required: true, type: () => [Player] })
  public players!: Player[];

  @prop({ required: true })
  public addonsData!: AddonsData;

  @prop({ required: true })
  public features!: GameOptionsFeatures;

  @prop({ type: Schema.Types.Mixed })
  public debug?: Dictionary<unknown>;
}

/**
 * Possible game stages
 */
export type TGameStage =
  | 'initialization'
  | 'votingForTeam'
  | 'hidden'
  | 'onMission'
  | 'selectTeam'
  | 'end'
  | TAddonsStages;

/**
 * Possible game results
 */
export type TGameEndReasons =
  | 'manualy'
  | 'evilTeamMissions'
  | 'goodTeamMissions'
  | 'missMerlin'
  | 'killMerlin'
  | 'missGuinevere'
  | 'killGuinevere'
  | 'missLovers'
  | 'killLovers'
  | 'missCleric'
  | 'killCleric';
