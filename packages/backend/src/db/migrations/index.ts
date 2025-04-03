import type { Migration } from '@/db/migrations/interface';
import { removeGamesWithInvalidUsers } from './removeGamesWithInvalidUsers';

export class MigrationManager {
  static async runMigrations(): Promise<void> {
    const migrations: Migration[] = [removeGamesWithInvalidUsers];

    for (const migration of migrations) {
      await migration.up();
      console.log(`Migration ${migration.name} applied successfully`);
    }
  }
}
