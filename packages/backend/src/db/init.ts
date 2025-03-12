import mongoose from 'mongoose';
import { config } from '@/config';
import { MigrationManager } from '@/db/migrations';

export const connectDB = async () => {
  try {
    const connectionParams = {
      dbName: config.DB_NAME,
      authSource: 'admin',
    };

    const prodSettings =
      process.env.NODE_ENV === 'production'
        ? ({
            authMechanism: 'DEFAULT',
            retryWrites: true,
          } as const)
        : {};

    const instance = await mongoose.connect(config.MONGODB_URI, { ...connectionParams, ...prodSettings });

    console.log(`✅ MongoDB Connected [${config.DB_NAME}]`);

    MigrationManager.runMigrations();

    return instance;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  }
};
