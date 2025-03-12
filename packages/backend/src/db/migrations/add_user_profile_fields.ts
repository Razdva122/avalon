import { userProfileModel } from '@/db/models';
import { Migration } from '@/db/migrations/interface';

export const addUserProfileFields: Migration = {
  name: 'add-user-profile-fields',
  async up() {
    await userProfileModel.updateMany({}, [
      {
        $set: {
          login: '$email',
          avatar: 'servant',
          registrationDate: new Date().toISOString(),
        },
      },
    ]);
  },
};
