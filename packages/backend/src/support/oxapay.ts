import { createHmac, timingSafeEqual } from 'crypto';

export interface OxaPayConfig {
  apiKey: string;
  callbackURL: string;
  frontendURL: string;
  sandbox: boolean;
}

export function oxaPayConfig(): OxaPayConfig | null {
  const apiKey = process.env.OXAPAY_MERCHANT_API_KEY;
  const frontendURL = process.env.SUPPORT_FRONTEND_URL;
  const mode = process.env.OXAPAY_SANDBOX ?? 'true';
  if (!apiKey || !frontendURL || !['true', 'false'].includes(mode)) return null;
  try {
    const callbackURL = process.env.OXAPAY_CALLBACK_URL || new URL('/api/support/oxapay/ipn', frontendURL).href;
    for (const value of [frontendURL, callbackURL]) {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password) return null;
    }
    return { apiKey, frontendURL, callbackURL, sandbox: mode === 'true' };
  } catch {
    return null;
  }
}

export function oxaTrackId(value: unknown): string {
  const id = typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : value;
  if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(id)) throw new Error('invalid_track_id');
  return id;
}

export function oxaCheckoutURL(value: unknown): string {
  if (typeof value !== 'string') throw new Error('invalid_checkout');
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    !['pay.oxapay.com', 'oxapay.com'].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.port
  )
    throw new Error('invalid_checkout');
  return url.href;
}

export function verifyOxaSignature(raw: Buffer, signature: string | undefined, key: string): boolean {
  if (!Buffer.isBuffer(raw) || !key || !signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac('sha512', key).update(raw).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

export class OxaPay {
  constructor(private config: OxaPayConfig) {}

  private async request(path: string, body?: unknown): Promise<Record<string, unknown>> {
    let status: number | undefined;
    try {
      const response = await fetch(`https://api.oxapay.com/v1/${path}`, {
        method: body ? 'POST' : 'GET',
        headers: { merchant_api_key: this.config.apiKey, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15000),
      });
      status = response.status;
      const result = await response.json();
      if (
        !response.ok ||
        result.status !== 200 ||
        result.error ||
        !result.data ||
        typeof result.data !== 'object' ||
        Array.isArray(result.data)
      )
        throw new Error('invalid_response');
      return result.data;
    } catch {
      // Do not log response bodies, credentials, order IDs or payment IDs.
      console.warn('OxaPay request failed', { endpoint: body ? 'payment/invoice' : 'payment/:id', status });
      throw new Error('provider_unavailable');
    }
  }

  async createInvoice(order: { orderId: string; amountCents: number }) {
    const data = await this.request('payment/invoice', {
      amount: order.amountCents / 100,
      currency: 'USD',
      order_id: order.orderId,
      description: 'Avalon hosting and domain support',
      callback_url: this.config.callbackURL,
      return_url: new URL('/support/', this.config.frontendURL).href,
      sandbox: this.config.sandbox,
      lifetime: 60,
      fee_paid_by_payer: 0,
      under_paid_coverage: 0,
      mixed_payment: false,
      auto_withdrawal: false,
    });
    return { providerInvoiceId: `oxapay:${oxaTrackId(data.track_id)}`, checkoutUrl: oxaCheckoutURL(data.payment_url) };
  }

  async getPayment(trackId: string) {
    return this.request(`payment/${oxaTrackId(trackId)}`);
  }
}
