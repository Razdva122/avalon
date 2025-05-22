import type { Migration } from '@/db/migrations/interface';
import { initAchievementsMigration } from '@/db/migrations/initAchievements';
import { userFeaturesEventsMigration } from '@/db/migrations/userFeaturesEvents';
// import { example } from '@/db/migrations/example';

export class MigrationManager {
  static async runMigrations(): Promise<void> {
    const migrations: Migration[] = [
      // Пример миграции (закомментирован, чтобы не выполнялся)
      // example,

      // Миграция для инициализации достижений
      initAchievementsMigration,

      // Миграция для обработки пользовательских фич и вызова событий
      userFeaturesEventsMigration,
    ];

    for (const migration of migrations) {
      await migration.up();
      console.log(`Migration ${migration.name} applied successfully`);
    }
  }
}
