import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { MongoRecoveryRepository } from './repository';
let server: MongoMemoryServer;
beforeAll(async () => {
  server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await server?.stop();
});
test('cleanup uses expiry indexes and retains accounts and live tokens', async () => {
  const repo = new MongoRecoveryRepository(mongoose.connection.db!, 'cleanup_users');
  await repo.init();
  const now = new Date();
  await repo.users.insertMany(
    Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      email: `${i}@example.com`,
      password: 'hash',
      recoveryTokens: [{ hash: String(i), email: `${i}@example.com`, expiresAt: new Date(+now + (i ? 60000 : -1)) }],
    })),
  );
  const updates = jest.spyOn(repo.users, 'updateMany');
  await repo.cleanup(now);
  for (const [filter] of updates.mock.calls) {
    const plan = await repo.users.find(filter).explain('executionStats');
    expect(plan.executionStats.totalDocsExamined).toBeLessThan(10);
  }
  updates.mockRestore();
  expect(await repo.users.countDocuments()).toBe(100);
  expect((await repo.users.findOne({ id: '0' }))?.recoveryTokens).toEqual([]);
  expect((await repo.users.findOne({ id: '1' }))?.recoveryTokens).toHaveLength(1);
});
