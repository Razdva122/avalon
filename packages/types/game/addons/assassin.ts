import { prop } from '@typegoose/typegoose';

import { TRoles } from '../roles';

/**
 * Data for assassinate in progress
 */
export class AssassinateProgressData {
  @prop({ required: true })
  public type!: TAssassinateType;

  @prop({ required: true })
  public stage!: number;

  @prop({ type: [String] })
  public possibleTargets?: TRoles[]; // Предполагается, что TRoles это строка
}

/**
 * Possible assassinate result
 */
export type TAssassinateResult = 'miss' | 'hit';

/**
 * Possible assassin addons stages
 */
export type TAssassinAddonStages = 'assassinate';

export type TAssassinAddonFeatures = {
  /**
   * True if player assassin
   */
  isAssassin?: boolean;
};

/**
 * Possible assassinate targets
 */
export type TAssassinateType = 'merlin' | 'lovers' | 'guinevere' | 'cleric';

/**
 * Data for game
 */
export class AssassinAddonData {
  @prop({ required: true, type: () => [String] })
  public assassinateTargets!: TAssassinateType[];

  @prop()
  public progressData?: AssassinateProgressData;
}
