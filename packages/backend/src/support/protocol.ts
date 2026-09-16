import { createHmac, timingSafeEqual } from 'crypto';

function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, item]) => [key, sorted(item)]),
    );
  }
  return value;
}

export function verifySignature(body: unknown, signature: string | undefined, secret: string): boolean {
  if (!secret || !signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac('sha512', secret)
    .update(JSON.stringify(sorted(body)))
    .digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

export function parseAmountCents(value: unknown): number {
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error('invalid_amount');
  const match = /^(\d{1,6})(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) throw new Error('invalid_amount');
  const cents = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
  if (cents < 100 || cents > 1000000) throw new Error('invalid_amount');
  return cents;
}

export function checkoutURL(value: unknown): string {
  if (typeof value !== 'string') throw new Error('invalid_checkout');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'nowpayments.io' || url.username || url.password || url.port) {
    throw new Error('invalid_checkout');
  }
  return url.href;
}

export interface InvoiceIdentity {
  orderId: string;
  providerInvoiceId?: string;
  amountCents: number;
  payCurrency: string;
}
export type ProviderPayment = Record<string, unknown>;

export function matchesPayment(invoice: InvoiceIdentity, payment: ProviderPayment): boolean {
  try {
    return (
      payment.order_id === invoice.orderId &&
      !!invoice.providerInvoiceId &&
      String(payment.invoice_id) === invoice.providerInvoiceId &&
      /^(\d+)$/.test(String(payment.payment_id)) &&
      payment.price_currency === 'usd' &&
      parseAmountCents(payment.price_amount) === invoice.amountCents &&
      payment.pay_currency === invoice.payCurrency
    );
  } catch {
    return false;
  }
}

export function qualifyPayment(invoice: InvoiceIdentity, payment: ProviderPayment): boolean {
  const due = Number(payment.pay_amount);
  const paid = Number(payment.actually_paid);
  return (
    matchesPayment(invoice, payment) &&
    payment.payment_status === 'finished' &&
    (typeof payment.actually_paid === 'number' || typeof payment.actually_paid === 'string') &&
    Number.isFinite(due) &&
    due > 0 &&
    Number.isFinite(paid) &&
    paid >= due
  );
}
