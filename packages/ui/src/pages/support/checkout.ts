export function isSupportAmount(value: string): boolean {
  return /^\d{1,6}(\.\d{1,2})?$/.test(value) && Number(value) >= 1 && Number(value) <= 10000;
}

export function safeCheckoutURL(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      !['pay.oxapay.com', 'oxapay.com'].includes(url.hostname) ||
      url.username ||
      url.password ||
      url.port
    )
      return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}
