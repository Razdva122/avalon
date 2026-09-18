import mongoose, { Schema } from 'mongoose';
import { DirectPayment, SupportOrder } from './service';

const directSchema = new Schema<DirectPayment>(
  {
    network: { type: String, required: true, enum: ['btc', 'tron', 'eth', 'bsc'] },
    txid: { type: String, required: true },
    address: { type: String, required: true },
    contract: String,
    decimals: { type: Number, required: true },
    amountAtomic: String,
    blockHash: String,
    blockHeight: Number,
    usdRate: String,
    rateSource: String,
    valuedAt: Date,
    nextCheckAt: Date,
    leaseToken: String,
    leaseUntil: Date,
    attempts: { type: Number, default: 0 },
    reassignments: [{ _id: false, from: String, to: String, reason: String, at: Date }],
  },
  { _id: false },
);
const schema = new Schema<SupportOrder>({
  provider: { type: String, required: true, enum: ['direct'] },
  sandbox: { type: Boolean, required: true },
  orderId: { type: String, required: true, unique: true },
  userID: { type: String, required: true, index: true },
  amountCents: { type: Number, required: true },
  payCurrency: { type: String, required: true },
  anonymous: { type: Boolean, required: true },
  status: { type: String, required: true },
  paymentID: { type: String, unique: true, sparse: true },
  claimKey: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, required: true },
  confirmedAt: Date,
  direct: directSchema,
});
schema.index({ status: 1, confirmedAt: -1 });
schema.index({ userID: 1, status: 1 });
schema.index({ provider: 1, 'direct.nextCheckAt': 1, 'direct.leaseUntil': 1 });
export const supportOrderModel = mongoose.model<SupportOrder>('SupportOrder', schema);

export async function supportTotalCents(userID: string): Promise<number> {
  const result = await supportOrderModel.aggregate<{ total: number }>([
    { $match: { userID, provider: 'direct', status: 'finished', sandbox: false } },
    { $group: { _id: null, total: { $sum: '$amountCents' } } },
  ]);
  return result[0]?.total || 0;
}
