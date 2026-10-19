import { MongoMemoryServer } from 'mongodb-memory-server-core';

export async function createTestMongo(): Promise<MongoMemoryServer> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await MongoMemoryServer.create({
        // Tests use loopback TCP; do not require additional Unix socket permissions.
        instance: { args: process.platform === 'win32' ? [] : ['--nounixsocket'] },
      });
    } catch (error) {
      // Port discovery releases the socket before mongod binds; retry only that race.
      if (!(error instanceof Error) || !/^Port "\d+" already in use$/.test(error.message) || attempt >= 3) {
        throw error;
      }
    }
  }
}
