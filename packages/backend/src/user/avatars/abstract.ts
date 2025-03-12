import { UserProfile } from '@avalon/types';

export interface IAvatar {
  id: string;

  isAvailableForUser(user: UserProfile): boolean;
}
