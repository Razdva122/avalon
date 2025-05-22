import { achievementModel, achievementStatsModel, userAchievementModel, roomModel } from '@/db/models';
import { achievementsData } from '@/achievements/data';
import { Achievement } from '@avalon/types';
import { Migration } from '@/db/migrations/interface';
import { eventBus } from '@/helpers';

/**
 * Миграция для инициализации достижений в базе данных
 */
export const initAchievementsMigration: Migration = {
  name: 'initAchievements',
  async up() {
    await this.down?.();

    console.log('Running achievement initialization migration...');

    // Шаг 1: Инициализация достижений
    console.log('Initializing achievements...');

    // Проверка существующих достижений
    const existingAchievements = await achievementModel.find().lean();
    console.log(`Found ${existingAchievements.length} existing achievements`);

    // Создание новых достижений
    let createdCount = 0;
    let updatedCount = 0;

    for (const achievementData of achievementsData) {
      const existingAchievement = existingAchievements.find((achievement) => achievement.id === achievementData.id);

      if (existingAchievement) {
        // Обновление существующего достижения
        await achievementModel.updateOne({ id: achievementData.id }, { $set: achievementData });
        updatedCount++;
      } else {
        // Создание нового достижения
        const achievement = new achievementModel(achievementData as Achievement);
        await achievement.save();
        createdCount++;

        // Инициализация статистики достижения
        await achievementStatsModel.findOneAndUpdate(
          { achievementID: achievementData.id },
          {
            $set: {
              achievementID: achievementData.id,
              totalUsers: 0,
              completedUsers: 0,
              completionPercentage: 0,
            },
          },
          { upsert: true, new: true },
        );
      }
    }

    console.log(`Created ${createdCount} new achievements`);
    console.log(`Updated ${updatedCount} existing achievements`);

    // Шаг 2: Обработка существующих игр для генерации прогресса достижений
    console.log('Processing existing games for achievement progress...');

    // Получаем все завершенные игры из базы данных
    const completedGames = await roomModel
      .find({
        'game.result.winner': { $exists: true },
      })
      .lean();

    console.log(`Found ${completedGames.length} completed games to process`);

    setTimeout(() => {
      // Обрабатываем каждую игру
      let processedCount = 0;
      for (const room of completedGames) {
        try {
          if (room.game) {
            setTimeout(() => {
              eventBus.emit('processGame', room.game);
            }, 100 * processedCount);
            processedCount++;
          }
        } catch (error) {
          console.error(`Error processing game:`, error);
        }
      }

      console.log(`Successfully processed ${processedCount} games for achievements`);
      console.log('Achievement initialization completed successfully');
    }, 30000);
  },

  // Опциональный метод down для отката миграции (если потребуется)
  async down() {
    // Удаление всех достижений и статистики
    // Обычно не используется, так как это может привести к потере данных
    console.log('Rolling back achievement initialization...');
    await achievementModel.deleteMany({});
    await achievementStatsModel.deleteMany({});
    await userAchievementModel.deleteMany({});
    console.log('Achievement initialization rolled back');
  },
};
