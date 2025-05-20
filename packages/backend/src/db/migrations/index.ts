import type { Migration } from '@/db/migrations/interface';

export class MigrationManager {
  static async runMigrations(): Promise<void> {
    const migrations: Migration[] = [
      // Add other migrations here
    ];

    for (const migration of migrations) {
      await migration.up();
      console.log(`Migration ${migration.name} applied successfully`);
    }
  }
}
