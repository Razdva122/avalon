import mongoose, { Schema } from 'mongoose';
import { GiveawayWinner } from '@avalon/types/giveaway';
import { userFeaturesModel } from '@/db/models';
export interface StoredDraw {
  _id: string;
  drawAt: Date;
  status: 'pending' | 'selected' | 'completed';
  solo: GiveawayWinner | null;
  group: (GiveawayWinner & { groupName: string }) | null;
  leaseToken?: string;
  leaseUntil?: Date;
  completedAt?: Date;
}
const winner = new Schema({ userID: String, name: String, avatar: String, groupName: String }, { _id: false });
const schema = new Schema<StoredDraw>({
  _id: String,
  drawAt: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'selected', 'completed'], required: true },
  solo: { type: winner, default: null },
  group: { type: winner, default: null },
  leaseToken: String,
  leaseUntil: Date,
  completedAt: Date,
});
schema.index({ status: 1, drawAt: -1 });
export const giveawayDrawModel = mongoose.model<StoredDraw>('PremiumGiveawayDraw', schema);
export const giveawayScheduleModel = mongoose.model<{ _id: string; initializedAt: Date; nextDrawAt: Date }>(
  'PremiumGiveawaySchedule',
  new Schema({ _id: String, initializedAt: Date, nextDrawAt: Date }),
);
export async function ensureGiveawayIndexes() {
  await Promise.all([
    giveawayDrawModel.createIndexes(),
    giveawayScheduleModel.createIndexes(),
    userFeaturesModel.createIndexes(),
  ]);
}
