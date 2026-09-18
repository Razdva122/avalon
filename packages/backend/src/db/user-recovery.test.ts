import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { UserLayer } from './user';
import { userProfileModel } from './models';
import { config } from '@/config';
import { authenticatedUser } from '@/user/sessions';

let mongo: MongoMemoryServer;
const users = new UserLayer();
let token: string;
jest.setTimeout(120000);
beforeAll(async () => {
  config.SECRET_KEY = 'recovery-credential-tests';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await userProfileModel.init();
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
beforeEach(async () => {
  await userProfileModel.deleteMany({});
  const result = await users.registerUser({
    id: 'player',
    name: 'Player',
    login: 'player',
    email: 'player@example.com',
    password: 'old-password',
    authVersion: 99,
  });
  if (!('token' in result)) throw new Error('fixture_registration_failed');
  token = result.token;
  await userProfileModel.collection.updateOne(
    { id: 'player' },
    {
      $set: {
        recoveryTokens: [
          { hash: 'pending-link', email: 'player@example.com', expiresAt: new Date(Date.now() + 60000) },
        ],
      },
    },
  );
});

test('registration ignores caller-supplied session version', async () => {
  expect((await userProfileModel.findOne({ id: 'player' }))!.authVersion).toBe(0);
  expect((await authenticatedUser(token)).authVersion).toBe(0);
});

test('ordinary password change atomically invalidates recovery links and old sessions', async () => {
  expect(await users.updateUserCredentials('player', 'old-password', 'password', 'new-password')).toBe(true);
  expect((await userProfileModel.collection.findOne({ id: 'player' }))!.recoveryTokens).toBeUndefined();
  await expect(authenticatedUser(token)).rejects.toThrow('revoked_session');
  const result = await users.login('player', 'new-password');
  if (!('token' in result)) throw new Error('login_failed');
  expect((await authenticatedUser(result.token)).authVersion).toBe(1);
});

test('email change clears old links while wrong-password changes do nothing', async () => {
  expect(await users.updateUserCredentials('player', 'incorrect', 'email', 'new@example.com')).toEqual({
    error: 'wrongPassword',
  });
  expect((await userProfileModel.collection.findOne({ id: 'player' }))!.recoveryTokens).toHaveLength(1);
  expect(await users.updateUserCredentials('player', 'old-password', 'email', 'NEW@example.com')).toBe(true);
  const user = await userProfileModel.collection.findOne({ id: 'player' });
  expect(user!.email).toBe('new@example.com');
  expect(user!.recoveryTokens).toBeUndefined();
});
