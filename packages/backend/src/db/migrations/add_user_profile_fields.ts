import { UserProfileModel } from '@avalon/types';
import { Migration } from '@/db/migrations/interface';

export const addUserProfileFields: Migration = {
  name: 'add-user-profile-fields',
  async up() {
    await UserProfileModel.updateMany(
      {},
      {
        $set: {
          login: '$email',
          avatar: 'servant',
          registrationDate: new Date().toISOString(),
        },
      },
    );
  },
};
