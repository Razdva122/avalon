import '@/init';
import mongoose from 'mongoose';
import { config } from '@/config';
import { supportConfig, NowPayments } from '@/support/provider';
import { MongoSupportRepository, supportOrderModel } from '@/support/repository';
import { SupportService } from '@/support/service';

// Operator recovery only. This reads NOWPayments and updates a matching local invoice;
// it cannot create a payment, send funds, or assign a payment to a different user.
async function main() {
  const paymentID = process.argv[2];
  const settings = supportConfig();
  if (!settings || !paymentID || !/^\d+$/.test(paymentID)) {
    throw new Error('Configure NOWPayments and pass its numeric payment ID (not a transaction hash).');
  }
  const payment = await new NowPayments(settings).getPayment(paymentID);
  if (String(payment.payment_id) !== paymentID) throw new Error('Payment ID mismatch');
  await mongoose.connect(config.MONGODB_URI, { dbName: config.DB_NAME, authSource: 'admin' });
  await supportOrderModel.init();
  await new SupportService(new MongoSupportRepository()).process(payment);
  console.log('Payment reconciled with its original Avalon invoice.');
}
main()
  .catch(() => {
    console.error(
      'Reconciliation failed. Check configuration, payment ID and invoice correspondence. No manual credit was granted.',
    );
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
