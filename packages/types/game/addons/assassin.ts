import { TRoles } from '../roles';

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
export type TAssassinateType = 'merlin' | 'lovers' | 'guinevere' | 'cleric';

/**
 * Data for game
 */
export type TAssassinAddonData = {
  assassin: {
    assassinateTargets: TAssassinateType[];
    progressData?: TAssassinateProgressData;
  };
};

/**
 * Data for assassinate in progress
 */
export type TAssassinateProgressData = {
  type: TAssassinateType;
  stage: number;
  possibleTargets?: TRoles[];
};
