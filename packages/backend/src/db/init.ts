import mongoose from 'mongoose';
import { config } from '@/config';
import { MigrationManager } from '@/db/migrations';

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL_MS = 5000;

let reconnectAttempts = 0;
let isConnecting = false;

/**
 * Настройка обработчиков событий подключения MongoDB
 */
const setupConnectionHandlers = () => {
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB Connected');
    reconnectAttempts = 0;
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB Disconnected');
    handleReconnect();
  });

  mongoose.connection.on('error', (error) => {
    console.error('❌ MongoDB Connection Error:', error);
    handleReconnect();
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB Reconnected');
    reconnectAttempts = 0;
  });
};

/**
 * Обработка переподключения к MongoDB
 */
const handleReconnect = async () => {
  if (isConnecting) {
    return;
  }

  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(`❌ MongoDB: Превышено максимальное количество попыток переподключения (${MAX_RECONNECT_ATTEMPTS})`);
    console.error('❌ Завершение процесса для перезапуска контейнера...');
    process.exit(1);
  }

  reconnectAttempts++;
  console.log(`🔄 MongoDB: Попытка переподключения ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);

  setTimeout(async () => {
    try {
      await connectDB();
    } catch (error) {
      console.error('❌ MongoDB Reconnect Error:', error);
    }
  }, RECONNECT_INTERVAL_MS);
};

export const connectDB = async () => {
  if (isConnecting) {
    console.log('⏳ MongoDB: Подключение уже в процессе...');
    return;
  }

  isConnecting = true;

  try {
    const connectionParams = {
      dbName: config.DB_NAME,
      authSource: 'admin',
      // Настройки для автоматического переподключения
      serverSelectionTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    };

    const prodSettings =
      process.env.NODE_ENV === 'production'
        ? ({
            authMechanism: 'DEFAULT',
            retryWrites: true,
            retryReads: true,
          } as const)
        : {};

    // Настраиваем обработчики только при первом подключении
    if (reconnectAttempts === 0) {
      setupConnectionHandlers();
    }

    const instance = await mongoose.connect(config.MONGODB_URI, { ...connectionParams, ...prodSettings });

    console.log(`✅ MongoDB Connected [${config.DB_NAME}]`);

    // Запускаем миграции только при первом успешном подключении
    if (reconnectAttempts === 0) {
      MigrationManager.runMigrations();
    }

    isConnecting = false;
    return instance;
  } catch (error) {
    isConnecting = false;
    console.error('❌ MongoDB Connection Error:', error);
    handleReconnect();
  }
};
