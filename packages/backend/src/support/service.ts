import { DirectNetwork } from './direct/protocol';

export interface DirectPayment {
  network: DirectNetwork;
  txid: string;
  address: string;
  contract?: string;
  decimals: number;
  amountAtomic?: string;
  blockHash?: string;
  blockHeight?: number;
  usdRate?: string;
  rateSource?: string;
  valuedAt?: Date;
  nextCheckAt?: Date;
  leaseToken?: string;
  leaseUntil?: Date;
  attempts: number;
  reassignments: { from: string; to: string; reason: string; at: Date }[];
}
export interface SupportOrder {
  orderId: string;
  provider: 'direct';
  sandbox: boolean;
  amountCents: number;
  payCurrency: string;
  userID: string;
  anonymous: boolean;
  status: string;
  paymentID?: string;
  claimKey?: string;
  createdAt: Date;
  confirmedAt?: Date;
  direct?: DirectPayment;
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
