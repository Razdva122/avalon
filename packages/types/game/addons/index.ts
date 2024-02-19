import type { TLadyOfLakeStages, TLadyOfLakeFeatures } from './lady-of-lake';
import type { TExcaliburStages, TExcaliburFeatures } from './excalibur';
import type { TAssassinAddonStages, TAssassinAddonFeatures } from './assassin';

export type { TAssassinateResult, TAssassinateType } from './assassin';

/**
 * Possible addons stages
 */
export type TAddonsStages = TLadyOfLakeStages | TExcaliburStages | TAssassinAddonStages;

/**
 * Player features added with addons
 */
export type TAddonsFeatures = TLadyOfLakeFeatures & TExcaliburFeatures & TAssassinAddonFeatures;
