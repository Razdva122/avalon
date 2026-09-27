import type { mongo } from 'mongoose';

/** Migrations must be idempotent: a process can die after up and before the completion marker. */
export interface Migration {
  name: string;
  up: (db: mongo.Db) => Promise<void>;
  down?: (db: mongo.Db) => Promise<void>;
}
