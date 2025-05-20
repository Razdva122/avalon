import { roomModel, userFeaturesModel } from '@/db/models';
import { Migration } from '@/db/migrations/interface';

export const addLastGameDate: Migration = {
  name: 'addLastGameDate',
  async up() {
    console.log('Starting migration: addLastGameDate');

    // Получаем все завершенные игры, отсортированные по дате начала
    const rooms = await roomModel
      .find({ stage: 'started', 'game.result': { $exists: true } })
      .sort({ startAt: 1 })
      .lean();

    console.log(`Found ${rooms.length} completed games`);

    // Для каждой игры обновляем lastGameDate для всех игроков
    for (const room of rooms) {
      const startDate = new Date(room.startAt);
      const playerIds = room.players.map((player) => player.id);

      console.log(`Processing game from ${startDate.toISOString()} with ${playerIds.length} players`);

      // Обновляем lastGameDate для каждого игрока
      // Используем bulkWrite для оптимизации производительности
      const bulkOps = playerIds.map((playerId) => ({
        updateOne: {
          filter: { userID: playerId },
          // Обновляем lastGameDate только если текущее значение отсутствует или старше
          update: {
            $max: { lastGameDate: startDate },
          },
          // Создаем запись, если она не существует
          upsert: true,
        },
      }));

      if (bulkOps.length > 0) {
        const result = await userFeaturesModel.bulkWrite(bulkOps);
        console.log(`Updated ${result.modifiedCount} user records, inserted ${result.upsertedCount} new records`);
      }
    }

    console.log('Migration addLastGameDate completed successfully');
  },

  // Опциональный метод для отката миграции
  async down() {
    console.log('Rolling back migration: addLastGameDate');

    // Удаляем поле lastGameDate у всех пользователей
    await userFeaturesModel.updateMany({}, { $unset: { lastGameDate: '' } });

    console.log('Rollback completed successfully');
  },
};
