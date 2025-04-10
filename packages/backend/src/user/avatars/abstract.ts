import { UserFeatures, UserProfile } from '@avalon/types';

export interface IAvatar {
  id: string;

  isAvailableForUser(options: { user: UserProfile; features: UserFeatures | null }): boolean;

  getInfo?(options: { user: UserProfile; features: UserFeatures | null }): string | undefined;
}
