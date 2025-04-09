import { prop, modelOptions, Severity } from '@typegoose/typegoose';
import { Schema } from 'mongoose';

import { HistoryBase } from './base';
import type { TAssassinateResult } from '../addons';
import type { TAssassinateType } from '../addons/assassin';

/**
 * History assassinate data
 */
export class HistoryAssassinate extends HistoryBase {
  declare type: 'assassinate';

  @prop({ required: true })
  public result!: TAssassinateResult;

  @prop({ required: true })
  public assassinID!: string;

  @prop({ required: true })
  public assassinateType!: TAssassinateType;

  @prop({ required: true, type: () => [String] })
  public killedIDs!: string[];
}

export class LancelotsIDs {
  @prop({ required: true })
  public good!: string;

  @prop({ required: true })
  public evil!: string;
}

/**
 * Switch lancelots data
 */
@modelOptions({
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class SwitchLancelots extends HistoryBase {
  declare type: 'switchLancelots';

  @prop()
  public lancelotsIDs?: LancelotsIDs;

  @prop({ required: true, type: Schema.Types.Mixed })
  public switches!: Array<boolean | null>;

  @prop({ required: true })
  public pointer!: number;

  @prop({ required: true })
  public result!: boolean;
}
