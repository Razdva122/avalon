import type { Migration } from '@/db/migrations/interface';
import { updateChatMessages } from './update-chat';

export class MigrationManager {
  static async runMigrations(): Promise<void> {
    const migrations: Migration[] = [updateChatMessages];

    for (const migration of migrations) {
      await migration.up();
      console.log(`Migration ${migration.name} applied successfully`);
    }
  }
}
