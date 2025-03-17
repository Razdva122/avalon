import { userProfileModel } from '@/db/models';
import { Migration } from '@/db/migrations/interface';

export const example: Migration = {
  name: 'example',
  async up() {
    await userProfileModel.updateMany({}, [
      {
        $set: {
          avatar: 'servant',
          registrationDate: new Date().toISOString(),
        },
      },
    ]);
  },
};
