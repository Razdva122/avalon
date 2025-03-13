import type { Migration } from '@/db/migrations/interface';
import { addUserFeatures } from './addUserFeatures';

export class MigrationManager {
  static async runMigrations(): Promise<void> {
    const migrations: Migration[] = [addUserFeatures];

    for (const migration of migrations) {
      await migration.up();
      console.log(`Migration ${migration.name} applied successfully`);
    }
  }
}
