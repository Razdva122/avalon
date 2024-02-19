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
export type TAssassinateType = 'merlin';
