/**
 * Possible lady of lake stages
 */
export type TLadyOfLakeStages = 'checkLoyalty' | 'announceLoyalty';

export type TLadyOfLakeFeatures = {
  /**
   * A sign that the player has the Lady of the Lake ability or not
   */
  ladyOfLake?: 'has' | 'used';
};
