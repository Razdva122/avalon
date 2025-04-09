import { prop } from '@typegoose/typegoose';

import { HistoryBase } from './base';
import type { TLoyalty, TRoles } from '../roles';

/**
 * Check loyalty data
 */
export class CheckLoyalty extends HistoryBase {
  declare type: 'checkLoyalty';

  @prop({ required: true })
  public validatorID!: string;

  @prop({ required: true })
  public inspectedID!: string;
}

/**
 * Reveal loyalty data
 */
export class RevealLoyalty extends HistoryBase {
  declare type: 'revealLoyalty';

  @prop({ required: true })
  public revealerID!: string;

  @prop({ required: true })
  public targetID!: string;
}

/**
 * Announce loyalty data
 */
export class AnnounceLoyalty extends HistoryBase {
  declare type: 'announceLoyalty';

  @prop({ required: true })
  public announcerID!: string;

  @prop({ required: true })
  public targetID!: string;

  @prop({ required: true })
  public announced!: TLoyalty | TRoles;

  @prop()
  public actual?: TLoyalty | TRoles;
}
