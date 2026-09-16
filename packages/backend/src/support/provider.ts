import { checkoutURL, ProviderPayment } from './protocol';

export interface SupportConfig {
  apiKey: string;
  ipnSecret: string;
  callbackURL: string;
  frontendURL: string;
  currencies: string[];
}

export function supportConfig(): SupportConfig | null {
  const {
    NOWPAYMENTS_API_KEY: apiKey,
    NOWPAYMENTS_IPN_SECRET: ipnSecret,
    NOWPAYMENTS_CALLBACK_URL: callbackURL,
    SUPPORT_FRONTEND_URL: frontendURL,
    NOWPAYMENTS_USDT_CURRENCIES: currencyList,
  } = process.env;
  if (!apiKey || !ipnSecret || !callbackURL || !frontendURL || !currencyList) return null;
  const currencies = [...new Set(currencyList.split(',').map((value) => value.trim().toLowerCase()))];
  if (!currencies.length || currencies.some((value) => !/^usdt[a-z0-9]*$/.test(value))) return null;
  try {
    for (const value of [callbackURL, frontendURL]) {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password) return null;
    }
  } catch {
    return null;
  }
  return { apiKey, ipnSecret, callbackURL, frontendURL, currencies };
}

export class MinimumPaymentError extends Error {
  constructor(public minimumUSD: number) {
    super('below_minimum');
  }
}

export class NowPayments {
  constructor(private config: SupportConfig) {}

  private async request(path: string, body?: unknown): Promise<Record<string, unknown>> {
    const response = await fetch(`https://api.nowpayments.io/v1/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'x-api-key': this.config.apiKey, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('provider_unavailable');
    return (await response.json()) as Record<string, unknown>;
  }

  async createInvoice(order: { orderId: string; amountCents: number; payCurrency: string }) {
    // Check actual merchant availability; network support changes independently of deployments.
    const available = await this.request('currencies');
    if (!Array.isArray(available.currencies) || !available.currencies.includes(order.payCurrency)) {
      throw new Error('network_unavailable');
    }
    const [estimate, minimum] = await Promise.all([
      this.request(`estimate?amount=${order.amountCents / 100}&currency_from=usd&currency_to=${order.payCurrency}`),
      this.request(
        `min-amount?currency_from=${order.payCurrency}&fiat_equivalent=usd&is_fixed_rate=false&is_fee_paid_by_user=false`,
      ),
    ]);
    const estimatedAmount = Number(estimate.estimated_amount);
    const minimumAmount = Number(minimum.min_amount);
    if (
      !Number.isFinite(estimatedAmount) ||
      estimatedAmount <= 0 ||
      !Number.isFinite(minimumAmount) ||
      minimumAmount <= 0
    ) {
      throw new Error('invalid_estimate');
    }
    if (estimatedAmount < minimumAmount) {
      throw new MinimumPaymentError(Math.ceil((order.amountCents * minimumAmount) / estimatedAmount) / 100);
    }
    const invoice = await this.request('invoice', {
      price_amount: order.amountCents / 100,
      price_currency: 'usd',
      pay_currency: order.payCurrency,
      order_id: order.orderId,
      order_description: 'Avalon hosting and domain support',
      ipn_callback_url: this.config.callbackURL,
      success_url: new URL('/support/', this.config.frontendURL).href,
      cancel_url: new URL('/support/', this.config.frontendURL).href,
      is_fixed_rate: false,
      is_fee_paid_by_user: false,
    });
    if (!/^\d+$/.test(String(invoice.id))) throw new Error('invalid_invoice');
    return { providerInvoiceId: String(invoice.id), checkoutUrl: checkoutURL(invoice.invoice_url) };
  }

  async getPayment(id: string): Promise<ProviderPayment> {
    if (!/^\d+$/.test(id)) throw new Error('invalid_payment');
    return this.request(`payment/${id}`);
  }
}
