import mongoose from 'mongoose';
import { connectDB } from './init';
import { MigrationManager } from './migrations';
jest.mock('@/config', () => ({ config: { MONGODB_URI: 'mongodb://localhost/test', DB_NAME: 'test' } }));
afterEach(() => {
  jest.restoreAllMocks();
});
test('connection failure rejects startup instead of returning an absent database', async () => {
  jest.spyOn(mongoose, 'connect').mockRejectedValueOnce(new Error('test-unavailable'));
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await expect(connectDB()).rejects.toThrow('test-unavailable');
});
test('callers share initialization and await migrations', async () => {
  let finish!: () => void;
  const blocked = new Promise<void>((resolve) => {
    finish = resolve;
  });
  jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
  jest.spyOn(MigrationManager, 'runMigrations').mockImplementation(async () => {
    await blocked;
  });
  let ready = false;
  const first = connectDB().then((value) => {
    ready = true;
    return value;
  });
  const second = connectDB();
  await Promise.resolve();
  await Promise.resolve();
  expect(ready).toBe(false);
  finish();
  expect(await first).toBe(mongoose);
  expect(await second).toBe(mongoose);
});
