import type { TLadyOfLakeStages, TLadyOfLakeFeatures } from './lady-of-lake';
import type { TLadyOfSeaAddonData, TLadyOfSeaFeatures } from './lady-of-sea';
import type { TExcaliburStages, TExcaliburFeatures } from './excalibur';
import type { TLancelotsStages } from './lancelots';
import type { TWitchStages } from './witch';
import type { TAssassinAddonStages, TAssassinAddonFeatures, TAssassinAddonData } from './assassin';

export type { TAssassinateResult, TAssassinateType, TAssassinAddonData, TAssassinateProgressData } from './assassin';

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
export type TAddonsData = Partial<TAssassinAddonData & TLadyOfSeaAddonData>;

/**
 * Addons names
 */
export type TAddonsName = 'ladyOfLake' | 'excalibur' | 'ladyOfSea';
