import { userFeaturesModel } from '@/db/models';
import { Migration } from '@/db/migrations/interface';

export const addUserFeatures: Migration = {
  name: 'add-user-features',
  async up() {
    const features = new userFeaturesModel({
      userID: '53082e46-dc7f-4266-be60-0b2eafbb0c03',
      isContributor: true,
      isHelper: true,
    });
    await features.save();
  },
};
