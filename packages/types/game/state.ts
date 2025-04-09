import { prop, Severity, modelOptions } from '@typegoose/typegoose';
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
  GiveCard,
  PreVote,
  LeadToVictory,
  Ambush,
  RestoreHonor,
  KingReturns,
  AnnounceLoyalty,
  RevealLoyalty,
  PlayCard,
} from './history';
import type { THistoryResults } from './history';
import { GameSettingsWithRoles } from './settings';
import { TAddonsStages, AddonsData } from './addons';
import type { TLoyalty } from '../game/roles';
import { GameOptionsFeatures } from '../game/options';
import type { Dictionary } from '../utils';

export class GameResults {
  @prop()
  winner?: TLoyalty;

  @prop({ required: true })
  reason!: TGameEndReasons;
}

@modelOptions({
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class VisualGameState {
  @prop({ _id: false })
  public result?: GameResults;

  @prop({ required: true })
  public uuid!: string;

  @prop({ required: true })
  public stage!: TGameStage;

  @prop({ required: true })
  public vote!: number;

  @prop({ required: true })
  public mission!: number;

  @prop({ required: true, type: () => [MissionWithResult], _id: false })
  public missionState!: MissionWithResult[];

  @prop({ required: true, _id: false })
  public settings!: GameSettingsWithRoles;

  @prop({
    _id: false,
    type: () => [HistoryBase],
    discriminators: () => [
      { type: HistoryVoteBase, value: 'vote' },
      { type: HistoryMissionBase, value: 'mission' },
      { type: HistoryAssassinate, value: 'assassinate' },
      { type: CheckLoyalty, value: 'checkLoyalty' },
      { type: AnnounceLoyalty, value: 'announceLoyalty' },
      { type: RevealLoyalty, value: 'revealLoyalty' },
      { type: SwitchResult, value: 'switchResult' },
      { type: HiddenHistory, value: 'hiddenHistory' },
      { type: SwitchLancelots, value: 'switchLancelots' },
      { type: GiveCard, value: 'giveCard' },
      { type: PreVote, value: 'preVote' },
      { type: LeadToVictory, value: 'leadToVictory' },
      { type: RestoreHonor, value: 'restoreHonor' },
      { type: Ambush, value: 'ambush' },
      { type: KingReturns, value: 'kingReturns' },
      { type: PlayCard, value: 'playCard' },
    ],
  })
  public history!: THistoryResults[];

  @prop({ required: true, type: () => [Player], _id: false })
  public players!: Player[];

  @prop({ required: true, _id: false })
  public addonsData!: AddonsData;

  @prop({ required: true, _id: false })
  public features!: GameOptionsFeatures;

  @prop({ type: Schema.Types.Mixed, _id: false })
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
  | 'killCleric'
  | 'rejectedVote';
