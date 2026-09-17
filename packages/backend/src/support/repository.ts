import mongoose, { Schema } from 'mongoose';
import { SupportOrder, SupportRepository } from './service';

const schema = new Schema<SupportOrder>({
  provider: { type: String, required: true, enum: ['oxapay'] },
  sandbox: { type: Boolean, required: true },
  orderId: { type: String, required: true, unique: true },
  userID: { type: String, required: true, index: true },
  amountCents: { type: Number, required: true },
  payCurrency: { type: String, required: true },
  anonymous: { type: Boolean, required: true },
  status: { type: String, required: true },
  providerInvoiceId: { type: String, unique: true, sparse: true },
  checkoutUrl: String,
  paymentID: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, required: true },
  confirmedAt: Date,
});
schema.index({ status: 1, confirmedAt: -1 });
schema.index({ userID: 1, status: 1 });
export const supportOrderModel = mongoose.model<SupportOrder>('SupportOrder', schema);

export class MongoSupportRepository implements SupportRepository {
  async find(orderId: string): Promise<SupportOrder | null> {
    return supportOrderModel.findOne({ orderId }).lean();
  }
  async updatePayment(orderId: string, paymentID: string, status: string, finished: boolean): Promise<void> {
    // A single conditional document write is safe on standalone Mongo too; no cross-document credit increment.
    const result = await supportOrderModel.updateOne(
      {
        orderId,
        status: { $nin: ['finished', 'test_paid'] },
        ...(finished ? { sandbox: false } : {}),
        // A hosted invoice can have a new attempt after an expired/failed payment.
        ...(finished ? {} : { $or: [{ paymentID: { $exists: false } }, { paymentID }] }),
      },
      { $set: { paymentID, status: finished ? 'finished' : status, ...(finished ? { confirmedAt: new Date() } : {}) } },
    );
    if (!result.matchedCount) {
      const current = await this.find(orderId);
      if (!current) throw new Error('unknown_order');
      // Completed orders stay immutable; late events from another attempt are harmless.
    }
  }
}

export async function supportTotalCents(userID: string): Promise<number> {
  const result = await supportOrderModel.aggregate<{ total: number }>([
    { $match: { userID, status: 'finished', sandbox: false } },
    { $group: { _id: null, total: { $sum: '$amountCents' } } },
  ]);
  return result[0]?.total || 0;
}
