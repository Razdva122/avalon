import { buildMongoURI } from '@/db/helpers';

interface Config {
  MONGODB_URI: string;
  DB_NAME: string;
  SECRET_KEY: string;
}

export const config: Config = {
  MONGODB_URI: buildMongoURI(),
  DB_NAME: process.env.DB_NAME!,
  SECRET_KEY: process.env.SECRET_KEY!,
};
