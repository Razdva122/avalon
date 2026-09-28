import mongoose, { mongo } from 'mongoose';
import { randomUUID } from 'crypto';
import { setTimeout as delay } from 'timers/promises';
import type { Migration } from './interface';

export class MigrationError extends Error {}

/** Never removes documents. Build a replacement unique index before dropping its weaker predecessor. */
export async function reconcileIndex(
  collection: mongo.Collection,
  keys: Record<string, 1 | -1>,
  options: mongo.CreateIndexesOptions = {},
): Promise<void> {
  const indexes = await collection.indexes().catch((error: { code?: number }) => {
    if (error.code === 26) return [];
    throw error;
  });
  const sameKeys = indexes.filter((index) => JSON.stringify(index.key) === JSON.stringify(keys));
  const equivalent = sameKeys.find(
    (index) =>
      !!index.unique === !!options.unique &&
      !!index.sparse === !!options.sparse &&
      JSON.stringify(index.partialFilterExpression) === JSON.stringify(options.partialFilterExpression) &&
      index.expireAfterSeconds === options.expireAfterSeconds,
  );
  if (equivalent) return;
  if (options.unique) {
    const duplicates = await collection
      .aggregate(
        [
          ...(options.partialFilterExpression ? [{ $match: options.partialFilterExpression }] : []),
          ...(options.sparse
            ? [{ $match: { $or: Object.keys(keys).map((key) => ({ [key]: { $exists: true } })) } }]
            : []),
          {
            $group: {
              _id: Object.fromEntries(Object.keys(keys).map((key, i) => [`k${i}`, `$${key}`])),
              count: { $sum: 1 },
            },
          },
          { $match: { count: { $gt: 1 } } },
          { $limit: 1 },
          { $project: { _id: 0, count: 1 } },
        ],
        { allowDiskUse: true, ...(options.collation ? { collation: options.collation } : {}) },
      )
      .toArray();
    if (duplicates.length) {
      throw new MigrationError(
        `Duplicate records prevent unique index on ${collection.collectionName} (${Object.keys(keys).join(', ')}). Run a read-only duplicate audit and resolve ownership manually; no records were deleted.`,
      );
    }
  }
  const desiredName =
    options.name ||
    Object.entries(keys)
      .map(([key, direction]) => `${key}_${direction}`)
      .join('_');
  const conflicting = indexes.find((index) => index.name === desiredName);
  // Modern MongoDB supports basic and unique indexes with the same key pattern.
  // Keep the old index until the new constraint has been built successfully.
  const name = conflicting ? `${desiredName}_migration_v1` : desiredName;
  try {
    await collection.createIndex(keys, { ...options, name });
  } catch {
    throw new MigrationError(
      `Cannot create index ${name} on ${collection.collectionName}. Stop conflicting writers and inspect duplicate records/index options; existing data and indexes were preserved.`,
    );
  }
  if (conflicting && sameKeys.includes(conflicting) && options.unique && !conflicting.unique) {
    await collection.dropIndex(conflicting.name!);
  }
}

/** Restore missing built-in definitions without replacing operator-configured requirements. */
export async function ensureAchievementCatalog(db: mongo.Db): Promise<void> {
  const { achievementModel } = await import('@/db/models');
  const { achievementsData } = await import('@/achievements/data');
  const constants = await import('@avalon/types/stats/achievements-constants');
  const ids = Object.entries(constants)
    .filter(([key]) => key.startsWith('ACHIEVEMENT_'))
    .map(([, value]) => String(value));
  if (ids.some((id) => !achievementsData.some((definition) => definition.id === id)))
    throw new MigrationError('Built-in achievement catalog is incomplete; add all handler IDs before startup.');
  const collection = db.collection(achievementModel.collection.name);
  for (const definition of achievementsData) {
    try {
      await collection.updateOne({ id: definition.id }, { $setOnInsert: definition }, { upsert: true });
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
    }
  }
  const definitions = await collection.find({ id: { $in: ids } }, { projection: { id: 1, requirement: 1 } }).toArray();
  if (
    definitions.length !== ids.length ||
    definitions.some((row) => !Number.isSafeInteger(row.requirement) || row.requirement < 1)
  )
    throw new MigrationError(
      'Achievement catalog has missing or invalid requirements; repair the configuration before startup.',
    );
}

/** Explicit version list: append a new migration whenever the persisted schema changes. */
export const migrations: Migration[] = [
  {
    name: '2026-09-27-database-integrity-indexes-v1',
    async up(db) {
      await import('@/db/models');
      await reconcileIndex(db.collection('rating_operations'), { done: 1, createdAt: 1, _id: 1 });
      for (const modelName of mongoose.modelNames()) {
        const model = mongoose.model(modelName);
        await model.createCollection();
        for (const [keys, options] of model.schema.indexes()) {
          await reconcileIndex(
            db.collection(model.collection.name),
            keys as Record<string, 1 | -1>,
            options as mongo.CreateIndexesOptions,
          );
        }
      }
    },
  },
  { name: '2026-09-27-achievement-catalog-v1', up: ensureAchievementCatalog },
  {
    name: '2026-09-28-room-chat-v1',
    async up(db) {
      await reconcileIndex(db.collection('room_chat_messages'), { roomID: 1, timestamp: -1, order: -1 });
    },
  },
  {
    name: '2026-09-28-best-of-the-best-v1',
    async up(db) {
      await ensureAchievementCatalog(db);
      const { backfillBestOfTheBest } = await import('@/achievements/best-of-the-best-backfill');
      console.info('Best of the Best backfill:', await backfillBestOfTheBest(db, true));
    },
  },
];

interface MigrationState {
  _id: string;
  owner?: string;
  leaseUntil?: Date;
  completedAt?: Date;
}
export class MigrationManager {
  static async runMigrations(db = mongoose.connection.db, pending = migrations): Promise<void> {
    if (!db) throw new Error('Database connection is required before migrations');
    const states = db.collection<MigrationState>('schemaMigrations');
    const owner = randomUUID();
    for (const migration of pending) {
      const deadline = Date.now() + 120000;
      for (;;) {
        const state = await states.findOne({ _id: migration.name });
        if (state?.completedAt) break;
        try {
          await states.updateOne(
            { _id: migration.name },
            { $setOnInsert: { leaseUntil: new Date(0) } },
            { upsert: true },
          );
        } catch (error) {
          if ((error as { code?: number }).code !== 11000) throw error;
        }
        const claimed = await states.findOneAndUpdate(
          { _id: migration.name, completedAt: { $exists: false }, leaseUntil: { $lte: new Date() } },
          { $set: { owner, leaseUntil: new Date(Date.now() + 1800000) } },
          { returnDocument: 'after' },
        );
        if (!claimed) {
          if (Date.now() >= deadline)
            throw new MigrationError(
              `Migration ${migration.name} is already running; retry startup after the other process finishes.`,
            );
          await delay(250);
          continue;
        }
        let leaseLost = false;
        let renewing: Promise<void> | undefined;
        const heartbeat = setInterval(() => {
          if (renewing) return;
          renewing = states
            .updateOne(
              { _id: migration.name, owner, leaseUntil: { $gt: new Date() } },
              { $set: { leaseUntil: new Date(Date.now() + 1800000) } },
            )
            .then((result) => {
              if (!result.matchedCount) leaseLost = true;
            })
            .catch(() => {
              leaseLost = true;
            })
            .finally(() => {
              renewing = undefined;
            });
        }, 60000);
        heartbeat.unref();
        try {
          await migration.up(db);
          clearInterval(heartbeat);
          await renewing;
          if (leaseLost) throw new MigrationError(`Migration ${migration.name} lease was lost; retry startup.`);
          const finished = await states.updateOne(
            { _id: migration.name, owner, leaseUntil: { $gt: new Date() } },
            { $set: { completedAt: new Date() }, $unset: { owner: '', leaseUntil: '' } },
          );
          if (!finished.matchedCount)
            throw new MigrationError(`Migration ${migration.name} lease was lost; retry startup.`);
        } catch (error) {
          clearInterval(heartbeat);
          await renewing;
          await states.updateOne(
            { _id: migration.name, owner },
            { $set: { leaseUntil: new Date(0) }, $unset: { owner: '' } },
          );
          throw error;
        }
        break;
      }
    }
  }
}
