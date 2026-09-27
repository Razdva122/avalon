import mongoose from 'mongoose';
import { config } from '@/config';
import { MigrationManager } from '@/db/migrations';

let initialization: Promise<typeof mongoose> | undefined;
let handlersInstalled = false;

export function connectDB(): Promise<typeof mongoose> {
  if (initialization) return initialization;
  if (!handlersInstalled) {
    handlersInstalled = true;
    mongoose.connection.on('connected', () => console.info('MongoDB connected'));
    mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected; driver will reconnect'));
    mongoose.connection.on('error', () => console.error('MongoDB connection error'));
  }
  initialization = (async () => {
    try {
      const instance = await mongoose.connect(config.MONGODB_URI, {
        dbName: config.DB_NAME,
        autoIndex: false,
        authSource: 'admin',
        serverSelectionTimeoutMS: 30000,
        heartbeatFrequencyMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
        ...(process.env.NODE_ENV === 'production'
          ? { authMechanism: 'DEFAULT' as const, retryWrites: true, retryReads: true }
          : {}),
      });
      await MigrationManager.runMigrations(instance.connection.db);
      return instance;
    } catch (error) {
      initialization = undefined;
      throw error;
    }
  })();
  return initialization;
}
