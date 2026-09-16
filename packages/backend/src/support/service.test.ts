import { SupportService, SupportOrder, SupportRepository, publicDonation } from './service';

class MemoryRepository implements SupportRepository {
  orders = new Map<string, SupportOrder>();
  async find(orderId: string) {
    return this.orders.get(orderId) || null;
  }
  async updatePayment(orderId: string, paymentID: string, status: string, finished: boolean) {
    const order = this.orders.get(orderId)!;
    if (order.status === 'finished') return;
    if (!finished && order.paymentID && order.paymentID !== paymentID) return;
    for (const row of this.orders.values()) {
      if (row.orderId !== orderId && row.paymentID === paymentID) throw new Error('payment_conflict');
    }
    Object.assign(order, { paymentID, status: finished ? 'finished' : status });
    if (finished) order.confirmedAt = new Date();
  }
}
const order: SupportOrder = {
  orderId: 'order-1',
  userID: 'user-1',
  providerInvoiceId: '42',
  amountCents: 1000,
  payCurrency: 'usdttrc20',
  anonymous: true,
  status: 'waiting',
  createdAt: new Date(),
};
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

describe('Support accounting', () => {
  let repository: MemoryRepository;
  let service: SupportService;
  beforeEach(() => {
    repository = new MemoryRepository();
    repository.orders.set(order.orderId, { ...order });
    service = new SupportService(repository);
  });
  test('duplicate concurrent completion credits only one invoice and cannot be downgraded', async () => {
    await Promise.all([service.process(payment), service.process(payment)]);
    await service.process({ ...payment, payment_status: 'waiting' });
    expect(
      [...repository.orders.values()]
        .filter((row) => row.status === 'finished')
        .reduce((sum, row) => sum + row.amountCents, 0),
    ).toBe(1000);
  });
  test('underpaid finished payments are held for review without credit', async () => {
    await service.process({ ...payment, actually_paid: 5 });
    expect((await repository.find('order-1'))?.status).toBe('review');
  });
  test('unrelated invoice, order and currency cannot change the ledger', async () => {
    for (const changes of [{ order_id: 'unknown' }, { invoice_id: 99 }, { pay_currency: 'btc' }]) {
      await expect(service.process({ ...payment, ...changes })).rejects.toThrow();
    }
    expect((await repository.find('order-1'))?.status).toBe('waiting');
  });
  test('a new valid attempt can finish an invoice after an earlier attempt expired', async () => {
    await service.process({ ...payment, payment_status: 'expired' });
    await service.process({ ...payment, payment_id: 999 });
    await service.process({ ...payment, payment_status: 'waiting' });
    expect((await repository.find('order-1'))?.status).toBe('finished');
    expect((await repository.find('order-1'))?.paymentID).toBe('999');
  });
  test('concurrent completed attempts for the same invoice only credit its nominal value once', async () => {
    await Promise.all([service.process(payment), service.process({ ...payment, payment_id: 999 })]);
    expect(
      [...repository.orders.values()]
        .filter((row) => row.status === 'finished')
        .reduce((sum, row) => sum + row.amountCents, 0),
    ).toBe(1000);
  });
  test('anonymous public projection contains no account or payment identifiers', () => {
    const result = publicDonation(
      { ...order, confirmedAt: new Date('2026-09-16T12:34:00Z'), paymentID: 'private' },
      'SecretName',
      false,
    );
    expect(result).toEqual({ id: 'order-1', amountUSD: 10, date: '2026-09-16', name: null });
    expect(publicDonation({ ...order, anonymous: false }, 'Name', true).name).toBeNull();
    expect(publicDonation({ ...order, anonymous: false }, 'Name', false).name).toBe('Name');
  });
});
