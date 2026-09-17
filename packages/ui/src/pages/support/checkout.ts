export interface SupportNetwork {
  currency: string;
  available: boolean;
  minimumUSD?: number;
  minimumUSDT?: number;
  reason?: 'not_enabled' | 'lookup_failed';
}

export function canPayAmount(network: SupportNetwork | undefined, amount: number): boolean {
  return !!network?.available && Number.isFinite(network.minimumUSD) && amount >= network.minimumUSD!;
}

export function selectSupportNetwork(networks: SupportNetwork[], current: string, amount: number): string {
  const available = networks.filter((network) => canPayAmount(network, Infinity));
  if (available.some((network) => network.currency === current)) return current;
  return (
    (
      available.find((network) => canPayAmount(network, amount)) ||
      available.reduce<SupportNetwork | undefined>(
        (best, network) => (!best || network.minimumUSD! < best.minimumUSD! ? network : best),
        undefined,
      )
    )?.currency || ''
  );
}
