/**
 * Possible assassinate result
 */
export type TAssassinateResult = 'miss' | 'hit';

/**
 * Possible merlin addons stages
 */
export type TMerlinAddonStages = 'selectMerlin';

export type TMerlinAddonFeatures = {
  /**
   * True if player assassin
   */
  isAssassin?: boolean;
};
