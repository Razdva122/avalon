import { prop } from '@typegoose/typegoose';

import { TLoyalty, TRoles } from '../roles';

/**
 * Data for game
 */
export class LadyOfSeaAddonData {
  @prop({ required: true, type: () => [String] })
  public loyaltyTargets!: Array<TRoles | TLoyalty>;
}
