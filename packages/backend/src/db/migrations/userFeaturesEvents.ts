import { Migration } from '@/db/migrations/interface';
import { userFeaturesModel } from '@/db/models';
import { eventBus } from '@/helpers/event-bus';

/**
 * Миграция для обработки пользовательских фич и вызова соответствующих событий
 * - Если у пользователя есть top1info, вызывает событие playerReachTop1
 * - Если у пользователя есть easterEggRevealed, вызывает событие playerRevealSecret
 */
export const userFeaturesEventsMigration: Migration = {
  name: 'userFeaturesEvents',
  async up() {
    // Находим пользователей с top1info
    const usersWithTop1 = await userFeaturesModel.find({ top1info: { $exists: true, $ne: null } });
    console.log(`Found ${usersWithTop1.length} users with top1info`);

    // Вызываем событие playerReachTop1 для каждого пользователя и удаляем поле top1info
    for (const user of usersWithTop1) {
      console.log(`Emitting playerReachTop1 for user ${user.userID}`);
      eventBus.emit('playerReachTop1', user.userID);
    }

    // Находим пользователей с easterEggRevealed
    const usersWithEasterEgg = await userFeaturesModel.find({ easterEggRevealed: true });
    console.log(`Found ${usersWithEasterEgg.length} users with easterEggRevealed`);

    // Вызываем событие playerRevealSecret для каждого пользователя и удаляем поле easterEggRevealed
    for (const user of usersWithEasterEgg) {
      console.log(`Emitting playerRevealSecret for user ${user.userID}`);
      eventBus.emit('playerRevealSecret', user.userID);
    }

    console.log('User features events migration completed successfully');
  },
};
