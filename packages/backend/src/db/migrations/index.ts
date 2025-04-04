import type { Migration } from '@/db/migrations/interface';
import { addTop1Avatar } from './addTop1Avatar';

export class MigrationManager {
  static async runMigrations(): Promise<void> {
    const migrations: Migration[] = [addTop1Avatar];

    for (const migration of migrations) {
      await migration.up();
      console.log(`Migration ${migration.name} applied successfully`);
    }
  }
}
