import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import type { RoleRating } from '@avalon/types';
import type { Filter, Sort } from 'mongodb';
import { roleRatingModel } from '@/db/models';

type Entry = RoleRating & { generation: string; date: Date; createdAt: Date; retiredAt?: Date };
type Publication = {
  _id: string;
  generation?: string;
  staging?: string;
  stagedAt?: Date;
  days?: { generation: string; date: Date }[];
};
type Staging = { previous: Publication | null; generation: string; createdAt: Date };
function collections() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database unavailable');
  return {
    entries: db.collection<Entry>('role_rating_generations'),
    publication: db.collection<Publication>('role_rating_publication'),
  };
}
export async function ensureRoleRatingIndexes(): Promise<void> {
  const { entries } = collections();
  await entries.createIndexes([
    { key: { generation: 1, userID: 1, role: 1 }, unique: true },
    { key: { generation: 1, role: 1, rank: 1 } },
    { key: { userID: 1, role: 1, date: 1 } },
    { key: { createdAt: 1, retiredAt: 1 } },
  ]);
}

/** Acquire the publication token before scanning the archive, fencing slower computations. */
export async function beginRoleRatingPublication(): Promise<Staging> {
  const { publication } = collections();
  const previous = await publication.findOne({ _id: 'current' });
  const generation = randomUUID();
  const createdAt = new Date();
  const result = await publication.updateOne(
    {
      _id: 'current',
      generation: previous?.generation ?? { $exists: false },
      staging: previous?.staging ?? { $exists: false },
    },
    { $set: { staging: generation, stagedAt: createdAt } },
    { upsert: !previous },
  );
  if (!result.matchedCount && !result.upsertedCount) throw new Error('Another rating computation started');
  return { previous, generation, createdAt };
}

/** Stage immutable normalized rows, then publish their pointer with one atomic write. */
export async function publishRoleRatings(ratings: RoleRating[], date: Date, staging?: Staging): Promise<void> {
  const { entries, publication } = collections();
  const { previous, generation, createdAt } = staging || (await beginRoleRatingPublication());
  for (let offset = 0; offset < ratings.length; offset += 500) {
    await entries.insertMany(
      ratings.slice(offset, offset + 500).map((row) => ({ ...row, generation, date, createdAt })),
    );
  }
  const cutoff = new Date(date.getTime() - 31 * 86400000);
  const day = date.toISOString().slice(0, 10);
  const days = [
    ...(previous?.days || []).filter((entry) => entry.date >= cutoff && entry.date.toISOString().slice(0, 10) !== day),
    { generation, date },
  ];
  const result = await publication.updateOne(
    { _id: 'current', generation: previous?.generation ?? { $exists: false }, staging: generation },
    { $set: { generation, days }, $unset: { staging: '', stagedAt: '' } },
  );
  if (!result.matchedCount) throw new Error('Another rating generation was published');
}

/** An orphan is retired first; readers of superseded generations get a full day to finish. */
export async function cleanupRoleRatingGenerations(now = new Date()): Promise<void> {
  const { entries, publication } = collections();
  const cutoff = new Date(now.getTime() - 86400000);
  // Revocation and publication use the same staging field, so an expired worker cannot republish.
  await publication.updateOne({ _id: 'current', stagedAt: { $lt: cutoff } }, { $unset: { staging: '', stagedAt: '' } });
  const current = await publication.findOne({ _id: 'current' });
  const protectedIDs = [
    current?.generation,
    current?.staging,
    ...(current?.days || []).map((entry) => entry.generation),
  ].filter((value): value is string => !!value);
  const orphan = { generation: { $nin: protectedIDs }, createdAt: { $lt: cutoff } };
  await entries.deleteMany({ ...orphan, retiredAt: { $lt: cutoff } });
  await entries.updateMany({ ...orphan, retiredAt: { $exists: false } }, { $set: { retiredAt: now } });
}

/** Every endpoint captures one pointer, including requests with multiple queries. */
export async function roleRatingView() {
  const { entries, publication } = collections();
  const current = await publication.findOne({ _id: 'current' });
  return {
    collection: current?.generation ? entries : roleRatingModel.collection,
    filter: current?.generation ? { generation: current.generation } : {},
  };
}
export async function readRoleRatings(filter: Filter<RoleRating>, sort: Sort, limit?: number): Promise<RoleRating[]> {
  const view = await roleRatingView();
  const cursor = view.collection
    .find(
      { ...filter, ...view.filter },
      { projection: { generation: 0, _id: 0, date: 0, createdAt: 0, retiredAt: 0 }, maxTimeMS: 10000 },
    )
    .sort(sort);
  if (limit) cursor.limit(limit);
  return cursor.toArray() as unknown as Promise<RoleRating[]>;
}
export async function readRoleHistory(userID: string, role: string, startDate: Date) {
  const { entries, publication } = collections();
  const current = await publication.findOne({ _id: 'current' });
  const days = (current?.days || []).filter((entry) => entry.date >= startDate);
  const rows = await entries
    .find(
      { userID, role: role as RoleRating['role'], generation: { $in: days.map((entry) => entry.generation) } },
      { projection: { date: 1, rating: 1, rank: 1, generation: 1 }, maxTimeMS: 10000 },
    )
    .toArray();
  const normalized = days.map((entry) => {
    const row = rows.find((value) => value.generation === entry.generation);
    return { date: entry.date, rating: row?.rating ?? null, rank: row?.rank ?? null };
  });
  return normalized.sort((a, b) => a.date.getTime() - b.date.getTime());
}
