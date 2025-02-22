import { prop } from '@typegoose/typegoose';

import type { TLadyOfLakeStages } from './lady-of-lake';
import type { LadyOfSeaAddonData } from './lady-of-sea';
import type { TExcaliburStages } from './excalibur';
import type { TLancelotsStages } from './lancelots';
import type { TWitchStages } from './witch';
import type { TAssassinAddonStages } from './assassin';
import { AssassinAddonData } from './assassin';

export type { TAssassinateResult, TAssassinateType, AssassinAddonData, AssassinateProgressData } from './assassin';

/**
 * Possible addons stages
 */
export type TAddonsStages =
  | TLadyOfLakeStages
  | TExcaliburStages
  | TAssassinAddonStages
  | TLancelotsStages
  | TWitchStages;

/**
 * Player features added with addons
 */
export class AddonsFeatures {
  /**
   * A sign that the player has the Lady of the Lake ability or not
   */
  @prop()
  ladyOfLake?: 'has' | 'used';

  /**
   * A sign that the player has the Lady of the sea ability or not
   */
  @prop()
  ladyOfSea?: 'has' | 'used';

  /**
   * A sign that the player has the excalibur
   */
  @prop()
  excalibur?: boolean;

  /**
   * True if player assassin
   */
  @prop()
  isAssassin?: boolean;
}

/**
 * Addons data
 */
export class AddonsData {
  @prop({ _id: false })
  public assassin?: AssassinAddonData;

  @prop({ _id: false })
  public ladyOfSea?: LadyOfSeaAddonData;
}

/**
 * Addons names
 */
export type TAddonsName = 'ladyOfLake' | 'excalibur' | 'ladyOfSea';
