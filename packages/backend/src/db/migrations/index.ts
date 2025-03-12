import { addUserProfileFields } from '@/db/migrations/add_user_profile_fields';

export class MigrationManager {
  static async runMigrations(): Promise<void> {
    const migrations = [addUserProfileFields];

    for (const migration of migrations) {
      await migration.up();
      console.log(`Migration ${migration.name} applied successfully`);
    }
  }
}
