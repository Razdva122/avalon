import { OxaPay, oxaTrackId } from './oxapay';
import { parseAmountCents } from './protocol';
import { SupportRepository } from './service';

export class OxaPayService {
  constructor(
    private repository: SupportRepository,
    private provider: Pick<OxaPay, 'getPayment'>,
  ) {}

  async reconcile(trackId: string, expectedOrderId?: string): Promise<void> {
    const id = oxaTrackId(trackId);
    // Read authoritative data: webhook payloads differ between API versions.
    const payment = await this.provider.getPayment(id);
    if (
      oxaTrackId(payment.track_id) !== id ||
      typeof payment.order_id !== 'string' ||
      (expectedOrderId !== undefined && expectedOrderId !== payment.order_id)
    )
      throw new Error('payment_mismatch');
    const order = await this.repository.find(payment.order_id);
    if (
      !order ||
      order.provider !== 'oxapay' ||
      typeof order.sandbox !== 'boolean' ||
      order.providerInvoiceId !== `oxapay:${id}` ||
      payment.type !== 'invoice' ||
      payment.currency !== 'USD' ||
      parseAmountCents(payment.amount) !== order.amountCents
    )
      throw new Error('payment_mismatch');
    if (['finished', 'test_paid'].includes(order.status)) return;
    const status = typeof payment.status === 'string' ? payment.status.toLowerCase() : '';
    const statuses: Record<string, string> = {
      new: 'waiting',
      waiting: 'waiting',
      paying: 'confirming',
      paid: 'finished',
      underpaid: 'partially_paid',
      manual_accept: 'review',
      refunding: 'review',
      refunded: 'refunded',
      expired: 'expired',
    };
    if (!Object.prototype.hasOwnProperty.call(statuses, status)) throw new Error('invalid_status');
    let next = statuses[status];
    // Do not credit manually accepted/tolerated underpayments or test-mode invoices.
    if (status === 'paid') {
      if (payment.under_paid_coverage !== 0) next = 'review';
      else if (order.sandbox) next = 'test_paid';
    }
    await this.repository.updatePayment(order.orderId, `oxapay:${id}`, next, next === 'finished');
  }
}
