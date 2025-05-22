import { Migration } from '@/db/migrations/interface';
import { userFeaturesModel } from '@/db/models';

/**
 * Миграция для удаления устаревших полей из userFeaturesModel
 * - Удаляет поле top1info
 * - Удаляет поле easterEggRevealed
 */
export const userFeaturesEventsMigration: Migration = {
  name: 'userFeaturesEvents',
  async up() {
    // Находим пользователей с top1info
    const usersWithTop1 = await userFeaturesModel.find({ top1info: { $exists: true } });
    console.log(`Found ${usersWithTop1.length} users with top1info field`);

    // Удаляем поле top1info у каждого пользователя
    for (const user of usersWithTop1) {
      console.log(`Removing top1info field for user ${user.userID}`);
      await userFeaturesModel.updateOne({ _id: user._id }, { $unset: { top1info: 1 } });
    }

    // Находим пользователей с easterEggRevealed
    const usersWithEasterEgg = await userFeaturesModel.find({ easterEggRevealed: { $exists: true } });
    console.log(`Found ${usersWithEasterEgg.length} users with easterEggRevealed field`);

    // Удаляем поле easterEggRevealed у каждого пользователя
    for (const user of usersWithEasterEgg) {
      console.log(`Removing easterEggRevealed field for user ${user.userID}`);
      await userFeaturesModel.updateOne({ _id: user._id }, { $unset: { easterEggRevealed: 1 } });
    }

    console.log('User features fields removal completed successfully');
  },
};
