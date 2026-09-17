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

  private async request(path: string, body?: unknown, retried = false): Promise<Record<string, unknown>> {
    const url = new URL(`https://api.nowpayments.io/v1/${path}`);
    // Never log request bodies, payment IDs, credentials or raw provider messages.
    const endpoint = path.split('?')[0].replace(/\/\d+$/, '/:id');
    const currency = url.searchParams.get('currency_to') || url.searchParams.get('currency_from') || undefined;
    let status: number | undefined;
    let code: string | undefined;
    try {
      const response = await fetch(url.href, {
        method: body ? 'POST' : 'GET',
        headers: { 'x-api-key': this.config.apiKey, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15000),
      });
      status = response.status;
      const result = await response.json().catch(() => null);
      if (status === 429 && !body && !retried) {
        const retryAfter = response.headers.get('retry-after');
        const seconds = retryAfter === null ? 1 : Number(retryAfter);
        const delay = Number.isFinite(seconds) && seconds >= 0 ? Math.min(seconds * 1000, 5000) : 1000;
        console.warn('NOWPayments retrying rate-limited GET', { endpoint, currency, status });
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.request(path, undefined, true);
      }
      if (!response.ok) {
        // Only known provider codes may enter logs; arbitrary strings can contain secrets.
        if (
          ['INVALID_API_KEY', 'RATE_LIMIT_EXCEEDED', 'AMOUNT_MINIMAL_ERROR', 'CURRENCY_NOT_FOUND'].includes(
            result?.code,
          )
        )
          code = result.code;
        throw new Error('provider_unavailable');
      }
      if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('invalid_response');
      return result as Record<string, unknown>;
    } catch (error) {
      const reason =
        error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)
          ? 'timeout'
          : status === undefined
            ? 'network_error'
            : 'response_error';
      console.warn('NOWPayments request failed', { endpoint, currency, status, code, reason });
      throw new Error('provider_unavailable');
    }
  }

  private async merchantCurrencies(): Promise<string[]> {
    const result = await this.request('merchant/coins');
    if (!Array.isArray(result.selectedCurrencies)) throw new Error('invalid_currencies');
    return result.selectedCurrencies
      .filter((code): code is string => typeof code === 'string')
      .map((code) => code.toLowerCase());
  }

  async networkMinimums() {
    const available = await this.merchantCurrencies();
    const check = async (currency: string) => {
      if (!available.includes(currency)) return { currency, available: false, reason: 'not_enabled' as const };
      try {
        const estimate = await this.request(`estimate?amount=10&currency_from=usd&currency_to=${currency}`);
        const minimum = await this.request(
          `min-amount?currency_from=${currency}&fiat_equivalent=usd&is_fixed_rate=false&is_fee_paid_by_user=false`,
        );
        const rate = Number(estimate.estimated_amount);
        const minimumUSDT = Number(minimum.min_amount);
        if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(minimumUSDT) || minimumUSDT <= 0) {
          console.warn('NOWPayments invalid minimum', { currency });
          throw new Error('invalid_minimum');
        }
        return {
          currency,
          available: true,
          minimumUSDT,
          minimumUSD: Math.max(1, Math.ceil((minimumUSDT / rate) * 1000) / 100),
        };
      } catch {
        return { currency, available: false, reason: 'lookup_failed' as const };
      }
    };
    // NOWPayments rejects concurrent estimates from the production server with HTTP 429.
    const networks = [];
    for (const currency of this.config.currencies) networks.push(await check(currency));
    return networks;
  }

  async createInvoice(order: { orderId: string; amountCents: number; payCurrency: string }) {
    // Check actual merchant availability; network support changes independently of deployments.
    const available = await this.merchantCurrencies();
    if (!available.includes(order.payCurrency)) {
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
