import { TLoyalty, TRoles } from '../roles';

export type TLadyOfSeaFeatures = {
  /**
   * A sign that the player has the Lady of the sea ability or not
   */
  ladyOfSea?: 'has' | 'used';
};

/**
 * Data for game
 */
export type TLadyOfSeaAddonData = {
  ladyOfSea: {
    loyaltyTargets: Array<TRoles | TLoyalty>;
  };
};
