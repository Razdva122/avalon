import { UserFeatures, UserProfile } from '@avalon/types';

export interface IAvatar {
  id: string;

  isAvailableForUser(options: { user: UserProfile; features: UserFeatures | null; achievements: string[] }): boolean;

  getInfo?(options: { user: UserProfile; features: UserFeatures | null }): string | undefined;
}
