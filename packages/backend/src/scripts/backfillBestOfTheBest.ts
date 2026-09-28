import '@/init';
import mongoose from 'mongoose';
import { config } from '@/config';
import { MigrationManager, migrations } from '@/db/migrations';
import { backfillBestOfTheBest } from '@/achievements/best-of-the-best-backfill';

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--apply')) throw new Error('Usage: backfillBestOfTheBest.ts [--apply]');
  await mongoose.connect(config.MONGODB_URI, {
    dbName: config.DB_NAME,
    authSource: 'admin',
    autoIndex: false,
    autoCreate: false,
    serverSelectionTimeoutMS: 10000,
  });
  const db = mongoose.connection.db!;
  console.info('Best of the Best audit:', { database: config.DB_NAME, ...(await backfillBestOfTheBest(db)) });
  if (args.includes('--apply')) {
    const migration = migrations.find((m) => m.name === '2026-09-28-best-of-the-best-v1')!;
    await MigrationManager.runMigrations(db, [migration]);
    console.info('Best of the Best migration completed.');
  }
}

main()
  .catch((error: Error) => {
    console.error('Best of the Best backfill failed:', error.name);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
