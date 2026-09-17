import { UserFeatures, UserProfile } from '@avalon/types';

export interface IAvatar {
  id: string;
  premium?: boolean;

  isAvailableForUser(options: {
    user: UserProfile;
    features: UserFeatures | null;
    achievements: string[];
    premium?: boolean;
  }): boolean;

  getInfo?(options: { user: UserProfile; features: UserFeatures | null }): string | undefined;
}
