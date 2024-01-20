import type { TLadyOfLakeStages, TLadyOfLakeFeatures } from './lady-of-lake';
import type { TMerlinAddonStages, TMerlinAddonFeatures } from './merlin';
import type { TExcaliburStages, TExcaliburFeatures } from './excalibur';

export type { TAssassinateResult } from './merlin';

/**
 * Possible addons stages
 */
export type TAddonsStages = TMerlinAddonStages | TLadyOfLakeStages | TExcaliburStages;

/**
 * Player features added with addons
 */
export type TAddonsFeatures = TLadyOfLakeFeatures & TMerlinAddonFeatures & TExcaliburFeatures;
