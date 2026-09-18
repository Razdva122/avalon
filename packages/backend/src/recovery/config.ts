export interface MailConfig {
  user: string;
  password: string;
  from: string;
  origin: string;
  key: Buffer;
  eventSecret: string;
  production: boolean;
  allowedRecipients: string[];
  hourlyLimit: number;
  dailyLimit: number;
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 254) return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(email) ? email : null;
}

export function mailConfig(env: NodeJS.ProcessEnv = process.env): MailConfig | null {
  if (env.MAIL_ENABLED !== 'true') return null;
  const required = [
    'POSTBOX_SMTP_USER',
    'POSTBOX_SMTP_PASSWORD',
    'MAIL_FROM',
    'MAIL_FRONTEND_URL',
    'MAIL_ENCRYPTION_KEY',
    'MAIL_EVENT_SECRET',
  ];
  if (required.some((key) => !env[key])) throw new Error('Incomplete mail configuration');
  const origin = new URL(env.MAIL_FRONTEND_URL!);
  const production = env.NODE_ENV === 'production';
  if (
    origin.protocol !== 'https:' &&
    !(!production && origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname))
  ) {
    throw new Error('Mail frontend requires HTTPS');
  }
  if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/')
    throw new Error('Mail frontend must be an origin');
  const from = normalizeEmail(env.MAIL_FROM);
  if (!from || !/^[a-fA-F0-9]{64}$/.test(env.MAIL_ENCRYPTION_KEY!) || env.MAIL_EVENT_SECRET!.length < 32)
    throw new Error('Invalid mail configuration');
  const hourlyLimit = Number(env.MAIL_HOURLY_LIMIT || 1000);
  const dailyLimit = Number(env.MAIL_DAILY_LIMIT || 5000);
  if (![hourlyLimit, dailyLimit].every((n) => Number.isSafeInteger(n) && n > 0 && n <= 100000))
    throw new Error('Invalid mail limits');
  return {
    user: env.POSTBOX_SMTP_USER!,
    password: env.POSTBOX_SMTP_PASSWORD!,
    from,
    origin: origin.origin,
    key: Buffer.from(env.MAIL_ENCRYPTION_KEY!, 'hex'),
    eventSecret: env.MAIL_EVENT_SECRET!,
    production,
    allowedRecipients: (env.MAIL_TEST_RECIPIENTS || '')
      .split(',')
      .map(normalizeEmail)
      .filter((s): s is string => !!s),
    hourlyLimit,
    dailyLimit,
  };
}
