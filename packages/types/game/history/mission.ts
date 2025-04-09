import { prop, modelOptions, Severity } from '@typegoose/typegoose';
import { Schema } from 'mongoose';

import { HistoryBase } from './base';
import type { IAction, IActionWithResult } from './base';
import type { TMissionResult, MissionSettings } from '../mission';

/**
 * General history mission data
 */
@modelOptions({
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class HistoryMissionBase extends HistoryBase {
  declare type: 'mission';

  @prop({ required: true })
  public hidden!: boolean;

  @prop({ required: true })
  public index!: number;

  @prop({ required: true, _id: false })
  public settings!: MissionSettings;

  @prop()
  public leaderID?: string;

  @prop({ required: true, type: Schema.Types.Mixed, _id: false })
  public actions!: IAction[] | IActionWithResult[];

  @prop()
  public result?: TMissionResult;

  @prop()
  public fails?: number;
}

/**
 * Complete history mission data
 */
export class HistoryMission extends HistoryMissionBase {
  declare hidden: false;
  declare result: TMissionResult;
  declare fails: number;
}

/**
 * Hidden history mission data
 */
export class HistoryMissionHidden extends HistoryMissionBase {
  declare hidden: true;
  declare result: undefined;
  declare fails: undefined;
}

/**
 * History mission data
 */
export type THistoryMission = HistoryMissionHidden | HistoryMission;

/**
 * Change of mission action
 */
export class SwitchResult extends HistoryBase {
  declare type: 'switchResult';

  @prop({ required: true })
  public switcherID!: string;

  @prop()
  public targetID?: string;

  @prop()
  public result?: TMissionResult;
}
