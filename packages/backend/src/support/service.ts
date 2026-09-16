import { InvoiceIdentity, matchesPayment, ProviderPayment, qualifyPayment } from './protocol';

export interface SupportOrder extends InvoiceIdentity {
  userID: string;
  anonymous: boolean;
  status: string;
  checkoutUrl?: string;
  paymentID?: string;
  createdAt: Date;
  confirmedAt?: Date;
}
export interface SupportRepository {
  find(orderId: string): Promise<SupportOrder | null>;
  updatePayment(orderId: string, paymentID: string, status: string, finished: boolean): Promise<void>;
}

export class SupportService {
  constructor(private repository: SupportRepository) {}
  async process(payment: ProviderPayment): Promise<void> {
    if (typeof payment.order_id !== 'string') throw new Error('unknown_order');
    const order = await this.repository.find(payment.order_id);
    if (!order || !matchesPayment(order, payment)) throw new Error('payment_mismatch');
    if (order.status === 'finished') return;
    const status = String(payment.payment_status);
    if (
      ![
        'waiting',
        'confirming',
        'confirmed',
        'sending',
        'partially_paid',
        'finished',
        'failed',
        'expired',
        'refunded',
      ].includes(status)
    ) {
      throw new Error('invalid_status');
    }
    const finished = qualifyPayment(order, payment);
    await this.repository.updatePayment(
      order.orderId,
      String(payment.payment_id),
      status === 'finished' && !finished ? 'review' : status,
      finished,
    );
  }
}

export function publicDonation(order: SupportOrder, name: string | null, hideDonations: boolean) {
  return {
    id: order.orderId,
    amountUSD: order.amountCents / 100,
    date: (order.confirmedAt || order.createdAt).toISOString().slice(0, 10),
    name: order.anonymous || hideDonations ? null : name,
  };
}
