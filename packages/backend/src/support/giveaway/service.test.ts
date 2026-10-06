import mongoose from 'mongoose';
import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { userFeaturesModel, userProfileModel } from '@/db/models';
import { boardAuthorModel, boardListingModel, ensurePlayerBoardIndexes } from '@/player-boards/repository';
import { supportOrderModel, supportTotalCents } from '../repository';
import { hasPremium } from '../premium';
import { createSupportRouter } from '../routes';
import { DirectService } from '../direct/service';
import { GiveawayService, publicGiveaway } from './service';
import { giveawayDrawModel, ensureGiveawayIndexes } from './repository';
jest.setTimeout(120000);
let mongo: MongoMemoryServer;
let now: Date;
const cutoff = new Date('2026-10-11T15:00:00Z');
const zero = () => 0;
const service = (random: (max: number) => number = zero, grant?: (id: string, at: Date) => Promise<void>) =>
  new GiveawayService({ now: () => now, random, ...(grant ? { grant } : {}) });
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { autoIndex: false });
  await ensurePlayerBoardIndexes();
  await ensureGiveawayIndexes();
});
beforeEach(async () => {
  for (const collection of Object.values(mongoose.connection.collections)) await collection.deleteMany({});
  now = new Date('2026-10-06T12:00:00Z');
  await service().initialize();
  await userProfileModel.collection.insertMany(
    ['alice', 'bob', 'carol', 'dave'].map((id) => ({
      id,
      name: id,
      avatar: 'merlin',
      email: id + '@private.test',
      password: 'secret',
    })),
  );
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
async function listing(userID: string, kind: 'solo' | 'group' = 'solo', extra = {}) {
  return boardListingModel.create({
    userID,
    kind,
    groupName: 'Avalon',
    memberIDs: [],
    createdAt: new Date('2026-10-01T00:00:00Z'),
    bumpedAt: new Date('2026-10-01T00:00:00Z'),
    expiresAt: new Date('2026-11-01T00:00:00Z'),
    active: true,
    moderated: false,
    publishingBlocked: false,
    ...extra,
  });
}
test('initialization persists its future start and never backfills pre-launch weeks on restart', async () => {
  expect(await publicGiveaway()).toEqual({
    nextDrawAt: '2026-10-11T15:00:00.000Z',
    timeZone: 'Asia/Yekaterinburg',
    latestDraw: null,
  });
  now = new Date('2026-10-25T15:00:00Z');
  await service().initialize();
  expect((await publicGiveaway()).nextDrawAt).toBe('2026-10-11T15:00:00.000Z');
  while (await service().processOne()) {
    /* catch up */
  }
  expect(await giveawayDrawModel.countDocuments()).toBe(3);
  expect((await publicGiveaway()).nextDrawAt).toBe('2026-11-01T15:00:00.000Z');
  expect((await publicGiveaway()).latestDraw).toEqual({ drawAt: '2026-10-25T15:00:00.000Z', solo: null, group: null });
});
test('solo and party prizes have distinct recipients and lifetime rights without donations or privacy changes', async () => {
  await listing('alice');
  await listing('bob', 'group', { memberIDs: ['alice', 'carol'] });
  await userFeaturesModel.collection.insertOne({ userID: 'carol', hideSupport: true, showPremiumBadge: false });
  now = cutoff;
  expect(await service().processOne()).toBe(true);
  expect((await publicGiveaway()).latestDraw).toEqual({
    drawAt: cutoff.toISOString(),
    solo: { userID: 'alice', name: 'alice', avatar: 'merlin' },
    group: { userID: 'carol', name: 'carol', avatar: 'merlin', groupName: 'Avalon' },
  });
  for (const id of ['alice', 'carol'])
    expect(hasPremium(await supportTotalCents(id), await userFeaturesModel.findOne({ userID: id }).lean())).toBe(true);
  expect(await supportOrderModel.countDocuments()).toBe(0);
  expect(await userFeaturesModel.findOne({ userID: 'carol' }).lean()).toMatchObject({
    hideSupport: true,
    showPremiumBadge: false,
  });
  expect(await service().processOne()).toBe(false);
});
test('eligible party listing receives one ticket independent of member count, then one member is drawn', async () => {
  await listing('alice', 'group', { memberIDs: ['alice', 'carol', 'dave'] });
  await listing('bob', 'group');
  const bounds: number[] = [];
  now = cutoff;
  await service((max) => {
    bounds.push(max);
    return max - 1;
  }).processOne();
  expect(bounds).toEqual([2, 1]);
  expect((await publicGiveaway()).latestDraw?.group?.userID).toBe('bob');
});
test.each([
  { active: false },
  { moderated: true },
  { publishingBlocked: true },
  { expiresAt: cutoff },
  { createdAt: new Date('2026-10-11T15:00:01Z') },
  { bumpedAt: new Date('2026-10-11T15:00:01Z') },
])('excludes listing failing cutoff/publication eligibility %p', async (extra) => {
  await listing('alice', 'solo', extra);
  now = cutoff;
  await service().processOne();
  expect((await publicGiveaway()).latestDraw?.solo).toBe(null);
});
test('excludes banned/missing authors and granted or paid recipients; explicit ineligible members do not fallback', async () => {
  await listing('alice');
  await listing('bob', 'group', { memberIDs: ['alice', 'carol', 'missing'] });
  await listing('missing');
  await listing('dave');
  await boardAuthorModel.create({ userID: 'dave', banned: true });
  await userFeaturesModel.create({ userID: 'alice', premiumGrantedAt: new Date() });
  await supportOrderModel.create({
    provider: 'direct',
    sandbox: false,
    orderId: 'paid',
    userID: 'carol',
    amountCents: 1000,
    payCurrency: 'usdt',
    anonymous: true,
    status: 'finished',
    createdAt: new Date(),
  });
  now = cutoff;
  await service().processOne();
  expect((await publicGiveaway()).latestDraw).toEqual({ drawAt: cutoff.toISOString(), solo: null, group: null });
});
test('banned recipients are filtered inside an otherwise eligible party', async () => {
  await listing('alice', 'group', { memberIDs: ['bob', 'carol'] });
  await boardAuthorModel.create({ userID: 'bob', banned: true });
  now = cutoff;
  await service().processOne();
  expect((await publicGiveaway()).latestDraw?.group?.userID).toBe('carol');
});
test('failed grant hides results, preserves selection across restart, and retries the same recipients', async () => {
  await listing('alice');
  await listing('bob');
  now = cutoff;
  await expect(
    service(zero, async () => {
      throw Error('write unavailable');
    }).processOne(),
  ).rejects.toThrow('write unavailable');
  expect((await publicGiveaway()).latestDraw).toBe(null);
  await boardListingModel.updateMany({}, { $set: { active: false } });
  await service(() => {
    throw Error('must not reselect');
  }).processOne();
  expect((await publicGiveaway()).latestDraw?.solo?.userID).toBe('alice');
  expect(hasPremium(0, await userFeaturesModel.findOne({ userID: 'alice' }).lean())).toBe(true);
});
test('two processors cannot select or grant different draws for the same cutoff', async () => {
  await listing('alice');
  await listing('bob', 'group');
  now = cutoff;
  await Promise.all([service().processOne(), service().processOne()]);
  expect(await giveawayDrawModel.countDocuments()).toBe(1);
  expect(await userFeaturesModel.countDocuments({ premiumGrantedAt: { $exists: true } })).toBe(2);
  expect((await publicGiveaway()).nextDrawAt).toBe('2026-10-18T15:00:00.000Z');
});
test('expired lease recovers retained winners; unexpired lease prevents processing', async () => {
  now = cutoff;
  await giveawayDrawModel.create({
    _id: cutoff.toISOString(),
    drawAt: cutoff,
    status: 'selected',
    solo: { userID: 'alice', name: 'alice', avatar: 'merlin' },
    group: null,
    leaseToken: 'dead-process',
    leaseUntil: new Date(now.getTime() + 1000),
  });
  expect(await service().processOne()).toBe(false);
  now = new Date(now.getTime() + 1000);
  expect(
    await service(() => {
      throw Error('must not reselect');
    }).processOne(),
  ).toBe(true);
  expect((await publicGiveaway()).latestDraw?.solo?.userID).toBe('alice');
});
test('a partial grant retry retains the first grant date and completes the remaining winner', async () => {
  await listing('alice');
  await listing('bob', 'group');
  now = cutoff;
  const real = new GiveawayService({ now: () => now });
  // Inject a DB write failure only after the first real durable grant.
  let attempts = 0;
  await expect(
    service(zero, async (id, at) => {
      if (++attempts === 2) throw Error('second write failed');
      await userFeaturesModel.updateOne({ userID: id }, { $set: { premiumGrantedAt: at } }, { upsert: true });
    }).processOne(),
  ).rejects.toThrow('second write failed');
  expect((await publicGiveaway()).latestDraw).toBe(null);
  now = new Date('2026-10-12T00:00:00Z');
  await real.processOne();
  expect((await userFeaturesModel.findOne({ userID: 'alice' }).lean())?.premiumGrantedAt).toEqual(cutoff);
  expect((await userFeaturesModel.findOne({ userID: 'bob' }).lean())?.premiumGrantedAt).toEqual(cutoff);
  expect((await publicGiveaway()).latestDraw?.group?.userID).toBe('bob');
});
test('restart advances a completed draw when a crash occurred before schedule advancement', async () => {
  now = cutoff;
  await giveawayDrawModel.create({
    _id: cutoff.toISOString(),
    drawAt: cutoff,
    status: 'completed',
    solo: null,
    group: null,
  });
  expect(
    await service(() => {
      throw Error('must not reselect');
    }).processOne(),
  ).toBe(true);
  expect((await publicGiveaway()).nextDrawAt).toBe('2026-10-18T15:00:00.000Z');
});
test('a stale pending lease can be recovered to select fresh winners', async () => {
  await listing('alice');
  now = cutoff;
  await giveawayDrawModel.create({
    _id: cutoff.toISOString(),
    drawAt: cutoff,
    status: 'pending',
    leaseToken: 'dead',
    leaseUntil: cutoff,
  });
  expect(await service().processOne()).toBe(true);
  expect((await publicGiveaway()).latestDraw?.solo?.userID).toBe('alice');
});
test('an unset null grant field still receives usable lifetime Premium', async () => {
  await listing('alice');
  await userFeaturesModel.collection.insertOne({ userID: 'alice', premiumGrantedAt: null });
  now = cutoff;
  await service().processOne();
  expect(hasPremium(0, await userFeaturesModel.findOne({ userID: 'alice' }).lean())).toBe(true);
});
test('public unauthenticated giveaway DTO works with no payment networks and excludes incomplete/private data', async () => {
  const app = express();
  app.use('/api/support', createSupportRouter(new DirectService({ networks: () => [] })));
  const server: Server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  try {
    await listing('alice');
    now = cutoff;
    await service().processOne();
    const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/support/giveaway`);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = await response.json();
    expect(body.latestDraw.solo.userID).toBe('alice');
    expect(JSON.stringify(body)).not.toMatch(/password|email|lease|secret|contact|token/);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
