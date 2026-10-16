import mongoose from 'mongoose';
import type { MongoMemoryServer } from 'mongodb-memory-server-core';
import { createTestMongo } from '@/test-utils/mongo';
import { UserLayer } from './user';
import { roomModel, userProfileModel } from './models';

let mongo: MongoMemoryServer;
jest.setTimeout(120000);
beforeAll(async () => {
  mongo = await createTestMongo();
  await mongoose.connect(mongo.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

test('public profiles include registration date and count only completed AI games for that player', async () => {
  const registrationDate = '2025-03-12T10:30:00.000Z';
  await userProfileModel.create({
    id: 'player',
    name: 'Player',
    login: 'player',
    email: 'player@example.com',
    password: 'hash',
    registrationDate,
  });
  const room = (roomID: string, ai: unknown, reason = 'missions', stage = 'end', id = 'player') => ({
    roomID,
    players: [{ id }],
    ...(ai ? { ai } : {}),
    game: { stage, result: { reason, winner: 'good' } },
  });
  await roomModel.collection.insertOne(room('humans', undefined));
  const replays = mongoose.connection.collection('ai_room_replays');
  await replays.insertMany(
    [
      room('ai-one', { humanPlayerID: 'player' }),
      room('ai-friend', { humanPlayerIDs: ['player', 'friend'] }),
      room('stopped', {}, 'manualy'),
      room('unfinished', {}, 'missions', 'voting'),
      room('other-player', {}, 'missions', 'end', 'other'),
    ].map((state) => ({ state })),
  );
  const users = new UserLayer();
  expect(await users.getPublicUserProfile('player')).toMatchObject({ registrationDate, aiGamesCount: 2 });
  await replays.deleteMany({});
  expect(await users.getPublicUserProfile('player')).toMatchObject({ registrationDate, aiGamesCount: 0 });
});
