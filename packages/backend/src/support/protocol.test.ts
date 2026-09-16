import { createHmac } from 'crypto';
import { verifySignature, qualifyPayment, checkoutURL, parseAmountCents } from './protocol';

const invoice = { orderId: 'order-1', providerInvoiceId: '42', amountCents: 1000, payCurrency: 'usdttrc20' };
const payment = {
  order_id: 'order-1',
  invoice_id: 42,
  payment_id: 100,
  payment_status: 'finished',
  price_amount: 10,
  price_currency: 'usd',
  pay_currency: 'usdttrc20',
  pay_amount: 10.01,
  actually_paid: 10.01,
};

describe('NOWPayments trust boundary', () => {
  test('accepts a signed nested payload independent of object key order', () => {
    const canonical = '{"a":{"a":1,"z":2},"z":[{"a":3,"b":4}]}';
    const signature = createHmac('sha512', 'secret').update(canonical).digest('hex');
    expect(verifySignature({ z: [{ b: 4, a: 3 }], a: { z: 2, a: 1 } }, signature, 'secret')).toBe(true);
    expect(verifySignature({ z: [{ b: 9, a: 3 }], a: { z: 2, a: 1 } }, signature, 'secret')).toBe(false);
  });
  test('rejects missing, malformed and wrong signatures without throwing', () => {
    for (const signature of [undefined, '', 'zz'.repeat(64), 'ab'.repeat(64)]) {
      expect(verifySignature(payment, signature, 'secret')).toBe(false);
    }
    expect(verifySignature(payment, 'ab'.repeat(64), '')).toBe(false);
  });
  test('credits only a finished, fully paid matching invoice', () => {
    expect(qualifyPayment(invoice, payment)).toBe(true);
    for (const changes of [
      { payment_status: 'confirmed' },
      { payment_status: 'partially_paid' },
      { order_id: 'other' },
      { invoice_id: 43 },
      { price_amount: 100 },
      { price_currency: 'eur' },
      { pay_currency: 'btc' },
      { actually_paid: 9 },
      { actually_paid: null },
      { pay_amount: 0 },
      { payment_id: undefined },
    ])
      expect(qualifyPayment(invoice, { ...payment, ...changes })).toBe(false);
  });
  test('does not use binary floating point or round invalid price values into credit', () => {
    expect(parseAmountCents('10.01')).toBe(1001);
    for (const value of ['10.001', '-10', '1e3', {}, null, Infinity]) {
      expect(() => parseAmountCents(value)).toThrow();
    }
  });
  test('allows only official HTTPS hosted checkout URLs', () => {
    expect(checkoutURL('https://nowpayments.io/payment/?iid=42')).toContain('iid=42');
    for (const url of [
      'javascript:alert(1)',
      'https://nowpayments.io.evil.com/',
      'http://nowpayments.io/',
      'https://evil.com/',
    ]) {
      expect(() => checkoutURL(url)).toThrow();
    }
  });
});
