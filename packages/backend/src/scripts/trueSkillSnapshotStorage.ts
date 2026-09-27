import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { playerTrueSkillRatingModel } from '@/db/models';
import { MIN_GAMES_FOR_LEADERBOARD, calculateConservativeRating } from '@avalon/types/stats/trueskill-constants';

function collections() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database unavailable');
  return {
    entries: db.collection('trueskill_snapshot_entries'),
    publications: db.collection<{
      _id: string;
      generation?: string;
      date?: Date;
      count?: number;
      staging?: string;
      stagedAt?: Date;
    }>('trueskill_snapshot_publications'),
  };
}
export async function ensureTrueSkillSnapshotIndexes(): Promise<void> {
  const { entries } = collections();
  await entries.createIndexes([
    { key: { generation: 1, userID: 1 }, unique: true },
    { key: { userID: 1, date: 1 } },
    { key: { generation: 1, rank: 1 } },
    { key: { createdAt: 1, retiredAt: 1 } },
  ]);
}
export async function publishTrueSkillSnapshot(): Promise<void> {
  const { entries, publications } = collections();
  await cleanupTrueSkillSnapshots();
  const date = new Date();
  const day = date.toISOString().slice(0, 10);
  const previous = await publications.findOne({ _id: day });
  const generation = randomUUID();
  const started = await publications.updateOne(
    {
      _id: day,
      generation: previous?.generation ?? { $exists: false },
      staging: previous?.staging ?? { $exists: false },
    },
    { $set: { staging: generation, stagedAt: date } },
    { upsert: !previous },
  );
  if (!started.matchedCount && !started.upsertedCount) throw new Error('Another snapshot computation started');
  const cursor = playerTrueSkillRatingModel
    .find({ gamesCount: { $gte: MIN_GAMES_FOR_LEADERBOARD } }, { userID: 1, mu: 1, sigma: 1, _id: 0 })
    .sort({ mu: -1, userID: 1 })
    .lean()
    .cursor({ batchSize: 500 });
  let rank = 0;
  let batch: {
    generation: string;
    date: Date;
    day: string;
    createdAt: Date;
    userID: string;
    mu: number;
    sigma: number;
    conservativeRating: number;
    rank: number;
  }[] = [];
  try {
    for await (const rating of cursor) {
      batch.push({
        generation,
        date,
        day,
        createdAt: date,
        userID: rating.userID,
        mu: rating.mu,
        sigma: rating.sigma,
        conservativeRating: calculateConservativeRating(rating.mu, rating.sigma),
        rank: ++rank,
      });
      if (batch.length >= 500) {
        await entries.insertMany(batch);
        batch = [];
      }
    }
    if (batch.length) await entries.insertMany(batch);
  } finally {
    await cursor.close();
  }
  const result = await publications.updateOne(
    { _id: day, generation: previous?.generation ?? { $exists: false }, staging: generation },
    { $set: { generation, date, count: rank }, $unset: { staging: '', stagedAt: '' } },
  );
  if (!result.matchedCount) throw new Error('Another TrueSkill snapshot was published');
}

/** Sweep a bounded set of orphan generations; published daily history is retained. */
export async function cleanupTrueSkillSnapshots(now = new Date()): Promise<void> {
  const { entries, publications } = collections();
  const cutoff = new Date(now.getTime() - 86400000);
  await publications.updateMany({ stagedAt: { $lt: cutoff } }, { $unset: { staging: '', stagedAt: '' } });
  const candidates = entries.aggregate<{ _id: string }>(
    [
      { $match: { createdAt: { $lt: cutoff } } },
      { $group: { _id: '$generation', day: { $first: '$day' } } },
      {
        $lookup: { from: 'trueskill_snapshot_publications', localField: 'day', foreignField: '_id', as: 'publication' },
      },
      {
        $match: {
          $expr: {
            $and: [
              { $not: [{ $in: ['$_id', '$publication.generation'] }] },
              { $not: [{ $in: ['$_id', '$publication.staging'] }] },
            ],
          },
        },
      },
      { $limit: 100 },
    ],
    { allowDiskUse: true },
  );
  try {
    for await (const candidate of candidates) {
      const filter = { generation: candidate._id, createdAt: { $lt: cutoff } };
      await entries.deleteMany({ ...filter, retiredAt: { $lt: cutoff } });
      await entries.updateMany({ ...filter, retiredAt: { $exists: false } }, { $set: { retiredAt: now } });
    }
  } finally {
    await candidates.close();
  }
}
