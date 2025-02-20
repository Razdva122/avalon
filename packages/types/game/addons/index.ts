import { prop } from '@typegoose/typegoose';

import type { TLadyOfLakeStages, TLadyOfLakeFeatures } from './lady-of-lake';
import type { LadyOfSeaAddonData, TLadyOfSeaFeatures } from './lady-of-sea';
import type { TExcaliburStages, TExcaliburFeatures } from './excalibur';
import type { TLancelotsStages } from './lancelots';
import type { TWitchStages } from './witch';
import type { TAssassinAddonStages, TAssassinAddonFeatures } from './assassin';
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
export type TAddonsFeatures = TLadyOfLakeFeatures & TLadyOfSeaFeatures & TExcaliburFeatures & TAssassinAddonFeatures;

/**
 * Addons data
 */
export class AddonsData {
  @prop()
  public assassin?: AssassinAddonData;

  @prop()
  public ladyOfSea?: LadyOfSeaAddonData;
}

/**
 * Addons names
 */
export type TAddonsName = 'ladyOfLake' | 'excalibur' | 'ladyOfSea';
