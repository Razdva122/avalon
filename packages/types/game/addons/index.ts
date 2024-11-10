import type { TLadyOfLakeStages, TLadyOfLakeFeatures } from './lady-of-lake';
import type { TExcaliburStages, TExcaliburFeatures } from './excalibur';
import type { TLancelotsStages } from './lancelots';
import type { TWitchStages } from './witch';
import type { TAssassinAddonStages, TAssassinAddonFeatures, TAssassinAddonData } from './assassin';

export type { TAssassinateResult, TAssassinateType, TAssassinAddonData } from './assassin';

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
export type TAddonsFeatures = TLadyOfLakeFeatures & TExcaliburFeatures & TAssassinAddonFeatures;

/**
 * Addons data
 */
export type TAddonsData = Partial<TAssassinAddonData>;
