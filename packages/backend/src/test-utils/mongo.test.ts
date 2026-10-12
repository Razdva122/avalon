import net from 'node:net';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import * as ports from 'mongodb-memory-server-core/lib/util/getport';
import { createTestMongo } from './mongo';

jest.setTimeout(30000);
afterEach(() => jest.restoreAllMocks());

test('starts MongoDB on another port when the selected port is occupied before mongod binds', async () => {
  const occupied = net.createServer();
  await new Promise<void>((resolve, reject) => {
    occupied.once('error', reject);
    occupied.listen(0, '127.0.0.1', resolve);
  });
  const port = (occupied.address() as net.AddressInfo).port;
  const selected = jest.spyOn(ports, 'getFreePort').mockResolvedValueOnce(port);
  let mongo: MongoMemoryServer | undefined;
  try {
    mongo = await createTestMongo();
    expect(mongo.instanceInfo?.port).not.toBe(port);
    expect(selected.mock.calls.length).toBeGreaterThan(1);
  } finally {
    await mongo?.stop();
    await new Promise<void>((resolve, reject) => occupied.close((error) => (error ? reject(error) : resolve())));
  }
});

test('does not retry unrelated MongoDB startup errors', async () => {
  const error = new Error('Unsupported MongoDB version');
  const create = jest.spyOn(MongoMemoryServer, 'create').mockRejectedValue(error);
  await expect(createTestMongo()).rejects.toBe(error);
  expect(create).toHaveBeenCalledTimes(1);
});

test('gives up after three port collisions', async () => {
  const error = new Error('Port "54366" already in use');
  const create = jest.spyOn(MongoMemoryServer, 'create').mockRejectedValue(error);
  await expect(createTestMongo()).rejects.toBe(error);
  expect(create).toHaveBeenCalledTimes(3);
});
