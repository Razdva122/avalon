import mongoose from 'mongoose';
import { config } from '@/config';

export const connectDB = async () => {
  try {
    const connectionParams = {
      dbName: config.DB_NAME,
      authSource: 'admin',
    };

    const prodSettings =
      process.env.NODE_ENV === 'production'
        ? ({
            ssl: true,
            sslValidate: true,
            authMechanism: 'DEFAULT',
            retryWrites: true,
            w: 'majority',
          } as const)
        : {};

    const instance = await mongoose.connect(config.MONGODB_URI, { ...connectionParams, ...prodSettings });

    console.log(`✅ MongoDB Connected [${config.DB_NAME}]`);
    return instance;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  }
};
