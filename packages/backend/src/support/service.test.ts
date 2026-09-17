import { publicDonation, SupportOrder } from './service';
test('public donations omit account and provider identifiers and honor anonymity', () => {
  const order: SupportOrder = {
    orderId: 'order-1',
    provider: 'oxapay',
    sandbox: false,
    userID: 'private-user',
    amountCents: 1000,
    payCurrency: 'crypto',
    anonymous: true,
    status: 'finished',
    createdAt: new Date('2026-09-16'),
    paymentID: 'private-payment',
  };
  expect(publicDonation(order, { id: 'private-user', name: 'Secret Name', avatar: 'merlin' }, false)).toEqual({
    id: 'order-1',
    amountUSD: 10,
    date: '2026-09-16',
    name: null,
    userID: null,
    avatar: null,
  });
  expect(
    publicDonation({ ...order, anonymous: false }, { id: 'private-user', name: 'Name', avatar: 'merlin' }, true),
  ).toMatchObject({ name: null, userID: null, avatar: null });
  expect(
    publicDonation({ ...order, anonymous: false }, { id: 'private-user', name: 'Name', avatar: 'merlin' }, false),
  ).toMatchObject({ name: 'Name', userID: 'private-user', avatar: 'merlin' });
});

test('missing profiles expose no account identity', () => {
  const order = {
    orderId: 'deleted',
    userID: 'deleted-user',
    amountCents: 1000,
    anonymous: false,
    createdAt: new Date('2026-09-16'),
  } as SupportOrder;
  expect(publicDonation(order, null, false)).toEqual({
    id: 'deleted',
    amountUSD: 10,
    date: '2026-09-16',
    name: null,
    userID: null,
    avatar: null,
  });
});

test('a mismatched profile cannot expose another account', () => {
  const order = {
    orderId: 'order-1',
    userID: 'owner',
    amountCents: 1000,
    anonymous: false,
    createdAt: new Date('2026-09-16'),
  } as SupportOrder;
  expect(publicDonation(order, { id: 'another-user', name: 'Other', avatar: 'merlin' }, false)).toMatchObject({
    name: null,
    userID: null,
    avatar: null,
  });
});
