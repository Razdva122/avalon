import '@/init';
import mongoose from 'mongoose';
import { config } from '@/config';
import { oxaPayConfig, OxaPay, oxaTrackId } from '@/support/oxapay';
import { MongoSupportRepository, supportOrderModel } from '@/support/repository';
import { OxaPayService } from '@/support/oxapay-service';

// Operator recovery only. This reads OxaPay and updates a matching local invoice;
// it cannot create a payment, send funds, or assign a payment to a different user.
async function main() {
  const paymentID = process.argv[2];
  const settings = oxaPayConfig();
  if (!settings || !paymentID) {
    throw new Error('Configure OxaPay and pass the invoice track_id (not a transaction hash).');
  }
  oxaTrackId(paymentID);
  await mongoose.connect(config.MONGODB_URI, { dbName: config.DB_NAME, authSource: 'admin' });
  await supportOrderModel.init();
  await new OxaPayService(new MongoSupportRepository(), new OxaPay(settings)).reconcile(paymentID);
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
