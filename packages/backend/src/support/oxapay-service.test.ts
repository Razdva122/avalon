import { OxaPayService } from './oxapay-service';
import { SupportOrder, SupportRepository } from './service';

const data = {
  track_id: '123456',
  order_id: 'order-1',
  type: 'invoice',
  currency: 'USD',
  amount: 10,
  status: 'paid',
  under_paid_coverage: 0,
};
const initial = {
  orderId: 'order-1',
  userID: 'owner',
  provider: 'oxapay',
  sandbox: false,
  providerInvoiceId: 'oxapay:123456',
  payCurrency: 'crypto',
  amountCents: 1000,
  anonymous: true,
  status: 'waiting',
  createdAt: new Date(),
};
let order: SupportOrder;
let repository: SupportRepository;
beforeEach(() => {
  order = { ...initial } as SupportOrder;
  repository = {
    find: async (id) => (id === order.orderId ? order : null),
    updatePayment: async (_id, paymentID, status, finished) => {
      if (order.status === 'finished') return;
      Object.assign(order, { paymentID, status: finished ? 'finished' : status });
    },
  };
});
const service = (payment = data) => new OxaPayService(repository, { getPayment: async () => payment });

test('paid invoice is credited once using API data, and late states cannot downgrade it', async () => {
  await Promise.all([service().reconcile('123456'), service().reconcile('123456')]);
  expect(order.status).toBe('finished');
  expect(order.paymentID).toBe('oxapay:123456');
  await service({ ...data, status: 'waiting' }).reconcile('123456');
  expect(order.status).toBe('finished');
});
test('test invoices never become real contributions even when the provider returns paid', async () => {
  Object.assign(order, { sandbox: true });
  await service().reconcile('123456');
  expect(order.status).toBe('test_paid');
});
test.each(['underpaid', 'manual_accept', 'paying', 'new', 'refunding'])('%s does not grant Premium', async (status) => {
  await service({ ...data, status }).reconcile('123456');
  expect(order.status).not.toBe('finished');
});
test.each([{ amount: 1 }, { currency: 'EUR' }, { type: 'payout' }, { track_id: '999' }, { order_id: 'other' }])(
  'rejects mismatched identity or amount: %j',
  async (change) => {
    await expect(service({ ...data, ...change }).reconcile('123456')).rejects.toThrow();
    expect(order.status).toBe('waiting');
  },
);
test('does not let OxaPay settle a legacy invoice or an invoice belonging to a different refresh request', async () => {
  await expect(service().reconcile('123456', 'another-order')).rejects.toThrow();
  Object.assign(order, { provider: undefined });
  await expect(service().reconcile('123456')).rejects.toThrow();
});
test('paid invoices with underpayment tolerance are held for review', async () => {
  await service({ ...data, under_paid_coverage: 5 }).reconcile('123456');
  expect(order.status).toBe('review');
});
