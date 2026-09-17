export interface SupportOrder {
  orderId: string;
  provider: 'oxapay';
  sandbox: boolean;
  providerInvoiceId?: string;
  amountCents: number;
  payCurrency: string;
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

export function publicDonation(
  order: SupportOrder,
  profile: { id: string; name: string; avatar: string } | null,
  hideDonations: boolean,
) {
  const visible = !order.anonymous && !hideDonations && profile?.id === order.userID;
  return {
    id: order.orderId,
    amountUSD: order.amountCents / 100,
    date: (order.confirmedAt || order.createdAt).toISOString().slice(0, 10),
    name: visible ? profile.name : null,
    userID: visible ? profile.id : null,
    avatar: visible ? profile.avatar : null,
  };
}
