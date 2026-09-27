import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import * as migrationModule from './index';
let server: MongoMemoryServer;
beforeAll(async () => {
  server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri(), { autoIndex: false });
});
afterAll(async () => {
  await mongoose.disconnect();
  await server?.stop();
});
beforeEach(async () => {
  await mongoose.connection.db!.dropDatabase();
});
test('concurrent startup applies and durably records a migration once', async () => {
  const db = mongoose.connection.db!;
  const migrations = [
    {
      name: 'test-one',
      up: async () => {
        await db.collection('effects').insertOne({ done: true });
      },
    },
  ];
  const run = migrationModule.MigrationManager.runMigrations as (...args: unknown[]) => Promise<void>;
  await Promise.all([run(db, migrations), run(db, migrations)]);
  await run(db, migrations);
  expect(await db.collection('effects').countDocuments()).toBe(1);
});
test('failed migration does not record success and can be retried', async () => {
  const run = migrationModule.MigrationManager.runMigrations as (...args: unknown[]) => Promise<void>;
  const db = mongoose.connection.db!;
  await expect(
    run(db, [
      {
        name: 'retry',
        up: async () => {
          throw new Error('test-failure');
        },
      },
    ]),
  ).rejects.toThrow('test-failure');
  await run(db, [
    {
      name: 'retry',
      up: async () => {
        await db.collection('effects').insertOne({ done: true });
      },
    },
  ]);
  expect(await db.collection('effects').countDocuments()).toBe(1);
});
test('unique index preflight preserves duplicates and old index without exposing values', async () => {
  const reconcile = migrationModule.reconcileIndex;
  expect(typeof reconcile).toBe('function');
  const collection = mongoose.connection.db!.collection('duplicates');
  await collection.insertMany([{ key: 'sensitive-value' }, { key: 'sensitive-value' }]);
  await collection.createIndex({ key: 1 });
  await expect(reconcile!(collection, { key: 1 }, { name: 'key_unique_v1', unique: true })).rejects.toThrow(
    /duplicate.*duplicates/i,
  );
  expect(await collection.countDocuments()).toBe(2);
  expect((await collection.indexes()).find((i) => i.name === 'key_1')).toBeDefined();
});
test('upgrades an existing nonunique index and enforces it on future writes', async () => {
  const collection = mongoose.connection.db!.collection('upgrade');
  await collection.insertMany([{ key: 'one' }, { key: 'two' }]);
  await collection.createIndex({ key: 1 });
  await migrationModule.reconcileIndex(collection, { key: 1 }, { unique: true });
  await migrationModule.reconcileIndex(collection, { key: 1 }, { unique: true });
  await expect(collection.insertOne({ key: 'one' })).rejects.toMatchObject({ code: 11000 });
  expect(await collection.countDocuments()).toBe(2);
});
test('declared production migrations initialize model collections and are repeatable', async () => {
  await migrationModule.MigrationManager.runMigrations();
  await migrationModule.MigrationManager.runMigrations();
  const db = mongoose.connection.db!;
  expect(await db.collection('schemaMigrations').countDocuments({ completedAt: { $exists: true } })).toBe(
    migrationModule.migrations.length,
  );
  const { roomModel, gameTrueSkillResultModel, userAchievementModel } = await import('@/db/models');
  for (const [model, keys] of [
    [roomModel, { roomID: 1 }],
    [gameTrueSkillResultModel, { gameID: 1 }],
    [userAchievementModel, { userID: 1, achievementID: 1 }],
  ] as const) {
    const indexes = await model.collection.indexes();
    expect(indexes.some((index) => index.unique && JSON.stringify(index.key) === JSON.stringify(keys))).toBe(true);
  }
});
test('startup restores missing achievement definitions while preserving configured requirements', async () => {
  const { achievementModel } = await import('@/db/models');
  await achievementModel.create({ id: 'light_wins', requirement: 37 });
  await migrationModule.MigrationManager.runMigrations();
  const constants = await import('@avalon/types/stats/achievements-constants');
  const ALL_ACHIEVEMENTS = Object.entries(constants)
    .filter(([key]) => key.startsWith('ACHIEVEMENT_'))
    .map(([, value]) => String(value));
  expect(await achievementModel.countDocuments({ id: { $in: ALL_ACHIEVEMENTS } })).toBe(ALL_ACHIEVEMENTS.length);
  expect((await achievementModel.findOne({ id: 'light_wins' }).lean())?.requirement).toBe(37);
});
test('an expired migration lease cannot mark completion', async () => {
  const db = mongoose.connection.db!;
  await expect(
    migrationModule.MigrationManager.runMigrations(db, [
      {
        name: 'expired',
        up: async () => {
          await db
            .collection<{ _id: string; leaseUntil: Date }>('schemaMigrations')
            .updateOne({ _id: 'expired' }, { $set: { leaseUntil: new Date(0) } });
        },
      },
    ]),
  ).rejects.toThrow(/lease was lost/);
  expect(await db.collection('schemaMigrations').countDocuments({ completedAt: { $exists: true } })).toBe(0);
});
test('startup refuses an invalid existing achievement requirement without overwriting it', async () => {
  await migrationModule.MigrationManager.runMigrations();
  const { achievementModel } = await import('@/db/models');
  await achievementModel.updateOne({ id: 'light_wins' }, { $set: { requirement: 0 } });
  await expect(migrationModule.ensureAchievementCatalog(mongoose.connection.db!)).rejects.toThrow(
    /invalid requirements/,
  );
  expect((await achievementModel.findOne({ id: 'light_wins' }).lean())?.requirement).toBe(0);
});
