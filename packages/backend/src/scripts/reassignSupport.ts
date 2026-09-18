import '@/init';
import mongoose from 'mongoose';
import { config } from '@/config';
import { supportOrderModel } from '@/support/repository';
import { directSupport } from '@/support/direct/service';

async function main() {
  const [orderId, expectedUserID, newUserID, ...reasonParts] = process.argv.slice(2);
  const reason = reasonParts.join(' ').trim();
  if (!orderId || !expectedUserID || !newUserID || !reason) {
    throw new Error('Usage: reassignSupport.ts ORDER_ID CURRENT_USER_ID NEW_USER_ID REASON');
  }
  await mongoose.connect(config.MONGODB_URI, { dbName: config.DB_NAME, authSource: 'admin' });
  await supportOrderModel.init();
  await directSupport.reassign(orderId, expectedUserID, newUserID, reason);
  console.log('Support reassigned. Both account totals now use the corrected owner. Audit reason saved.');
}
main()
  .catch((error: unknown) => {
    const allowed = ['invalid_reason', 'unknown_user', 'owner_changed'];
    const message = error instanceof Error ? error.message : '';
    console.error(
      message.startsWith('Usage:') || allowed.includes(message)
        ? message
        : 'Reassignment failed. Check the database configuration and account IDs.',
    );
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
