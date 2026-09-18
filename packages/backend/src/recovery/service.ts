import { randomBytes, randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { MailConfig, normalizeEmail } from './config';
import { decrypt, encrypt, privateKey, tokenHash } from './crypto';
import { Mail, mailLanguage, renderMail } from './mail';
import { MailJob, MongoRecoveryRepository } from './repository';

const minute = 60000;
export class RecoveryService {
  constructor(
    readonly repository: MongoRecoveryRepository,
    readonly config: MailConfig,
    private send: (mail: Mail) => Promise<void>,
    private clock: () => Date = () => new Date(),
  ) {}

  addressKey(email: string) {
    return privateKey(`address:${email}`, this.config.key);
  }
  private allowed(email: string) {
    return this.config.production || this.config.allowedRecipients.includes(email);
  }
  private job(kind: MailJob['kind'], payload: object, now: Date): MailJob {
    return {
      id: randomUUID(),
      kind,
      payload: encrypt(JSON.stringify(payload), this.config.key),
      expiresAt: new Date(+now + (kind === 'reset' ? 30 : 1440) * minute),
      availableAt: now,
      attempts: 0,
      state: 'pending',
    };
  }
  async request(raw: string, ip: string, language: unknown): Promise<void> {
    const now = this.clock();
    if (
      !(await this.repository.take(privateKey(`request:${ip}`, this.config.key), [{ count: 10, ms: 15 * minute }], now))
    )
      throw new Error('rate_limited');
    const email = normalizeEmail(raw);
    if (!email) throw new Error('invalid_email');
    const key = this.addressKey(email);
    const accepted = await this.repository.take(
      key,
      [
        { count: 1, ms: 2 * minute },
        { count: 3, ms: 60 * minute },
        { count: 5, ms: 1440 * minute },
      ],
      now,
    );
    const [user, suppressed] = await Promise.all([
      this.repository.users.findOne({ email }),
      this.repository.suppressed(key),
    ]);
    if (!accepted || !user || suppressed || !this.allowed(email)) return;
    const token = randomBytes(32).toString('hex');
    const locale = mailLanguage(language);
    const job = this.job('reset', { to: user.email, language: locale, token }, now);
    job.tokenHash = tokenHash(token);
    await this.repository.enqueue(
      user,
      { hash: job.tokenHash, email, expiresAt: job.expiresAt, language: locale },
      job,
    );
  }
  async reset(token: string, password: string, ip: string): Promise<string> {
    const now = this.clock();
    if (
      !(await this.repository.take(privateKey(`reset:${ip}`, this.config.key), [{ count: 10, ms: 15 * minute }], now))
    )
      throw new Error('rate_limited');
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new Error('invalid_token');
    if (
      typeof password !== 'string' ||
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72 ||
      /\s/.test(password)
    )
      throw new Error('invalid_password');
    const hash = tokenHash(token);
    const user = await this.repository.users.findOne({
      recoveryTokens: { $elemMatch: { hash, expiresAt: { $gt: now } } },
    });
    if (!user) throw new Error('invalid_token');
    const passwordHash = await bcrypt.hash(password, 12);
    const language = mailLanguage(user.recoveryTokens?.find((token) => token.hash === hash)?.language);
    const job = this.job('changed', { to: user.email, language }, now);
    const changed = await this.repository.consume(hash, passwordHash, job, this.clock());
    if (!changed) throw new Error('invalid_token');
    return changed.id;
  }
  async deliverOne(): Promise<boolean> {
    const now = this.clock();
    const claimed = await this.repository.claim(now);
    if (!claimed) return false;
    const { user, job } = claimed;
    try {
      const body = JSON.parse(decrypt(job.payload, this.config.key)) as {
        to: string;
        language: string;
        token?: string;
      };
      const current = await this.repository.users.findOne({ id: user.id });
      const valid =
        job.kind !== 'reset' ||
        current?.recoveryTokens?.some(
          (t) => t.hash === job.tokenHash && t.email === current.email && +t.expiresAt > +this.clock(),
        );
      if (!valid || !this.allowed(body.to) || (await this.repository.suppressed(this.addressKey(body.to)))) {
        await this.repository.finish(user.id, job);
        return true;
      }
      const global = await this.repository.take(
        'global-send',
        [
          { count: this.config.hourlyLimit, ms: 60 * minute },
          { count: this.config.dailyLimit, ms: 1440 * minute },
        ],
        now,
      );
      if (!global) {
        console.warn('mail_global_limit');
        await this.repository.finish(user.id, job, new Date(+now + 5 * minute));
        return true;
      }
      if (!(await this.repository.attempt(user.id, job))) return true;
      job.attempts++;
      await this.send(
        renderMail(
          body.to,
          body.language,
          body.token ? `${this.config.origin}/password-recovery/#${body.token}` : undefined,
        ),
      );
      await this.repository.finish(user.id, job);
      console.info('mail_sent', { kind: job.kind });
    } catch (error) {
      const code = (error as { responseCode?: number }).responseCode;
      const retry = typeof code === 'number' && code >= 400 && code < 500 && job.attempts < 3;
      await this.repository.finish(user.id, job, retry ? new Date(+now + minute * 2 ** (job.attempts - 1)) : undefined);
      // Do not log SMTP response text: it may contain addresses or credentials.
      console.warn(retry ? 'mail_retry' : 'mail_failed', { kind: job.kind, smtpCode: code });
    }
    return true;
  }
}
