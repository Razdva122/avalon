import { prop } from '@typegoose/typegoose';

import { Player } from './player';
import type { THistoryResults } from './history';
import type { IGameSettingsWithRoles } from './settings';
import type { TAddonsStages, TAddonsData } from './addons';
import type { TLoyalty } from '../game/roles';
import type { TGameOptionsFeatures } from '../game/options';
import type { IMissionWithResult } from './mission';
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

  @prop({ required: true })
  public missionState!: IMissionWithResult[];

  @prop({ required: true })
  public settings!: IGameSettingsWithRoles;

  @prop({ required: true })
  public history!: THistoryResults[];

  @prop({ required: true, type: () => [Player] })
  public players!: Player[];

  @prop({ required: true })
  public addonsData!: TAddonsData;

  @prop({ required: true })
  public features!: TGameOptionsFeatures;

  @prop()
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
