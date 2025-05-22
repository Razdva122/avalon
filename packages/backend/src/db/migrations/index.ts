import type { Migration } from '@/db/migrations/interface';
import { userFeaturesEventsMigration } from '@/db/migrations/userFeaturesEvents';

export class MigrationManager {
  static async runMigrations(): Promise<void> {
    const migrations: Migration[] = [
      // Миграция для обработки пользовательских фич и вызова событий
      userFeaturesEventsMigration,
    ];

    for (const migration of migrations) {
      await migration.up();
      console.log(`Migration ${migration.name} applied successfully`);
    }
  }
}
