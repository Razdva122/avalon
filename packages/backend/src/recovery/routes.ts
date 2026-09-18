import express, { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { setTimeout as delay } from 'timers/promises';
import { normalizeEmail } from './config';
import { RecoveryService } from './service';

export function createRecoveryRouter(service: RecoveryService | null, onReset: (id: string) => void = () => {}) {
  const router = express.Router();
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });
  router.use(express.json({ limit: '4kb' }));
  const route =
    (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => {
      void fn(req, res).catch(next);
    };
  router.get('/recovery', (_req, res) => res.json({ enabled: !!service }));
  router.post(
    '/forgot-password',
    route(async (req, res) => {
      if (!service) return res.status(503).json({ error: 'unavailable' });
      const started = Date.now();
      try {
        await service.request(req.body?.email, req.ip || 'unknown', req.body?.language === 'ru' ? 'ru' : 'en');
      } finally {
        // Equal work for existing/missing addresses plus a response floor. No SMTP in request path.
        await delay(Math.max(0, 300 - (Date.now() - started)));
      }
      return res.status(202).json({ ok: true });
    }),
  );
  router.post(
    '/reset-password',
    route(async (req, res) => {
      if (!service) return res.status(503).json({ error: 'unavailable' });
      const id = await service.reset(req.body?.token, req.body?.password, req.ip || 'unknown');
      onReset(id);
      return res.json({ ok: true });
    }),
  );
  // Called by an authenticated Cloud Function/event bridge, never directly by browsers.
  router.post(
    '/mail-events',
    route(async (req, res) => {
      if (!service) return res.status(503).json({ error: 'unavailable' });
      const provided = Buffer.from(req.get('authorization') || '');
      const expected = Buffer.from(`Bearer ${service.config.eventSecret}`);
      if (provided.length !== expected.length || !timingSafeEqual(provided, expected))
        return res.status(401).json({ error: 'unauthorized' });
      const event = req.body;
      const kind = event?.eventType;
      if (kind === 'Complaint' || (kind === 'Bounce' && event.bounce?.bounceType === 'Permanent')) {
        const recipients =
          kind === 'Complaint' ? event.complaint?.complainedRecipients : event.bounce?.bouncedRecipients;
        if (!Array.isArray(recipients) || recipients.length > 50)
          return res.status(400).json({ error: 'invalid_request' });
        const emails = recipients.map((r) => normalizeEmail(r?.emailAddress));
        if (emails.some((email) => !email)) return res.status(400).json({ error: 'invalid_request' });
        for (const email of emails) await service.repository.suppress(service.addressKey(email!), kind, new Date());
      }
      return res.json({ ok: true });
    }),
  );
  router.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(error);
    const code = error instanceof Error ? error.message : '';
    const invalid = ['invalid_email', 'invalid_password', 'invalid_token'].includes(code);
    const malformed = error instanceof SyntaxError || (error as { status?: number })?.status === 413;
    if (code === 'rate_limited') res.setHeader('Retry-After', '900');
    res
      .status(code === 'rate_limited' ? 429 : invalid || malformed ? 400 : 503)
      .json({ error: invalid || code === 'rate_limited' ? code : malformed ? 'invalid_request' : 'unavailable' });
  });
  return router;
}
