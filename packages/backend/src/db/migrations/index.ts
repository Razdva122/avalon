import type { Migration } from '@/db/migrations/interface';
import { trueSkillRatingSystem } from './trueSkillRatingSystem';

export class MigrationManager {
  static async runMigrations(): Promise<void> {
    const migrations: Migration[] = [
      // Add other migrations here
      trueSkillRatingSystem,
    ];

    for (const migration of migrations) {
      await migration.up();
      console.log(`Migration ${migration.name} applied successfully`);
    }
  }
}
