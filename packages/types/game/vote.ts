import type { TExcaliburFeatures } from './addons/excalibur';

/**
 * Possible vote option
 */
export type TVoteOption = 'approve' | 'reject';

/**
 * Team member
 */
export type TTeamMember = { id: string } & TExcaliburFeatures;
