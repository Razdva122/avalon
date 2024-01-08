import type { TLadyOfLakeStages, TLadyOfLakeFeatures } from './lady-of-lake';
import type { TMerlinAddonStages, TMerlinAddonFeatures } from './merlin';

export type { TAssassinateResult } from './merlin';

/**
 * Possible addons stages
 */
export type TAddonsStages = TMerlinAddonStages | TLadyOfLakeStages;

/**
 * Player features added with addons
 */
export type TAddonsFeatures = TLadyOfLakeFeatures & TMerlinAddonFeatures;
