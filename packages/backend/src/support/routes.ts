import { hasPremium } from './premium';
import express, { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { validateJWT } from '@/user';
import { userFeaturesModel, userProfileModel } from '@/db/models';
import { parseAmountCents } from './protocol';
import { OxaPay, oxaPayConfig, oxaTrackId, verifyOxaSignature } from './oxapay';
import { OxaPayService } from './oxapay-service';
import { MongoSupportRepository, supportOrderModel, supportTotalCents } from './repository';
import { publicDonation } from './service';

const repository = new MongoSupportRepository();
const asyncRoute =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };

export const supportRouter = express.Router();
supportRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// OxaPay signs the exact raw request bytes, not a parsed/sorted JSON object.
supportRouter.post(
  '/oxapay/ipn',
  express.raw({ type: 'application/json', limit: '32kb' }),
  asyncRoute(async (req, res) => {
    const config = oxaPayConfig();
    if (!config) return res.status(503).json({ error: 'unavailable' });
    if (!verifyOxaSignature(req.body, req.get('hmac'), config.apiKey))
      return res.status(401).json({ error: 'invalid_signature' });
    const body = JSON.parse(req.body.toString('utf8'));
    if (!body || body.type !== 'invoice') return res.status(400).json({ error: 'invalid_payment' });
    let trackId: string;
    try {
      trackId = oxaTrackId(body.track_id);
    } catch {
      return res.status(400).json({ error: 'invalid_payment' });
    }
    await new OxaPayService(repository, new OxaPay(config)).reconcile(trackId);
    return res.type('text/plain').send('ok');
  }),
);
supportRouter.use(express.json({ limit: '32kb' }));

supportRouter.get(
  '/',
  asyncRoute(async (_req, res) => {
    const config = oxaPayConfig();
    const orders = await supportOrderModel
      .find({ status: 'finished', sandbox: false })
      .sort({ confirmedAt: -1, _id: -1 })
      .limit(10)
      .lean();
    const userIDs = orders.filter((order) => !order.anonymous).map((order) => order.userID);
    const [profiles, features] = await Promise.all([
      userProfileModel.find({ id: { $in: userIDs } }, { id: 1, name: 1, avatar: 1 }).lean(),
      userFeaturesModel.find({ userID: { $in: userIDs } }, { userID: 1, hideSupport: 1 }).lean(),
    ]);
    res.json({
      enabled: !!config,
      provider: 'oxapay',
      sandbox: config?.sandbox ?? true,
      thresholdUSD: 10,
      donations: orders.map((order) =>
        publicDonation(
          order,
          profiles.find((user) => user.id === order.userID) || null,
          features.find((user) => user.userID === order.userID)?.hideSupport === true,
        ),
      ),
    });
  }),
);

supportRouter.use(
  asyncRoute(async (req, res, next) => {
    const token = req.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    let userID: string;
    try {
      const user = validateJWT(token);
      if (typeof user.id !== 'string') throw new Error('invalid_user');
      userID = user.id;
    } catch {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const exists = await userProfileModel.exists({ id: userID });
    if (!exists) return res.status(401).json({ error: 'unauthorized' });
    res.locals.userID = userID;
    next();
  }),
);

const privateRouter = express.Router();
privateRouter.get(
  '/me',
  asyncRoute(async (_req, res) => {
    const userID = res.locals.userID as string;
    const [total, features, orders] = await Promise.all([
      supportTotalCents(userID),
      userFeaturesModel.findOne({ userID }).lean(),
      supportOrderModel.find({ userID }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);
    res.json({
      totalUSD: total / 100,
      premium: hasPremium(total, features),
      hideSupport: features?.hideSupport === true,
      showPremiumBadge: features?.showPremiumBadge !== false,
      orders: orders.map((order) => ({
        id: order.orderId,
        amountUSD: order.amountCents / 100,
        status: order.status,
        sandbox: order.sandbox,
        createdAt: order.createdAt,
        checkoutUrl: ['waiting', 'confirming', 'confirmed', 'sending', 'partially_paid'].includes(order.status)
          ? order.checkoutUrl
          : undefined,
      })),
    });
  }),
);

privateRouter.patch(
  '/privacy',
  asyncRoute(async (req, res) => {
    const { hideSupport, showPremiumBadge } = req.body || {};
    if (typeof hideSupport !== 'boolean' || typeof showPremiumBadge !== 'boolean') {
      return res.status(400).json({ error: 'invalid_privacy' });
    }
    await userFeaturesModel.updateOne(
      { userID: res.locals.userID },
      { $set: { hideSupport, showPremiumBadge } },
      { upsert: true },
    );
    res.json({ ok: true });
  }),
);

privateRouter.post(
  '/invoice',
  asyncRoute(async (req, res) => {
    const config = oxaPayConfig();
    if (!config) return res.status(503).json({ error: 'unavailable' });
    const { amountUSD, anonymous } = req.body || {};
    let amountCents: number;
    try {
      amountCents = parseAmountCents(amountUSD);
    } catch {
      return res.status(400).json({ error: 'invalid_amount' });
    }
    if (typeof anonymous !== 'boolean') {
      return res.status(400).json({ error: 'invalid_invoice' });
    }
    const userID = res.locals.userID as string;
    await userFeaturesModel.updateOne({ userID }, { $setOnInsert: { userID } }, { upsert: true });
    // Database cooldown also covers multiple browser tabs and multiple backend processes.
    const claimed = await userFeaturesModel.findOneAndUpdate(
      {
        userID,
        $or: [
          { lastSupportCheckoutAt: { $exists: false } },
          { lastSupportCheckoutAt: { $lt: new Date(Date.now() - 60000) } },
        ],
      },
      { $set: { lastSupportCheckoutAt: new Date() } },
    );
    if (!claimed) return res.status(429).json({ error: 'too_many_requests' });
    const orderId = randomUUID();
    await supportOrderModel.create({
      orderId,
      userID,
      amountCents,
      provider: 'oxapay',
      sandbox: config.sandbox,
      payCurrency: 'crypto',
      anonymous,
      status: 'creating',
      createdAt: new Date(),
    });
    try {
      const invoice = await new OxaPay(config).createInvoice({ orderId, amountCents });
      await supportOrderModel.updateOne({ orderId }, { $set: { ...invoice, status: 'waiting' } });
      res.json({ id: orderId, url: invoice.checkoutUrl });
    } catch {
      await supportOrderModel.updateOne({ orderId }, { $set: { status: 'creation_failed' } });
      res.status(502).json({ error: 'invoice_failed' });
    }
  }),
);

privateRouter.post(
  '/orders/:id/refresh',
  asyncRoute(async (req, res) => {
    const config = oxaPayConfig();
    if (!config) return res.status(503).json({ error: 'unavailable' });
    const order = await supportOrderModel.findOne({ orderId: req.params.id, userID: res.locals.userID }).lean();
    if (!order) return res.status(404).json({ error: 'not_found' });
    if (order.provider !== 'oxapay' || !order.providerInvoiceId?.startsWith('oxapay:'))
      return res.status(409).json({ error: 'awaiting_notification' });
    if (!['finished', 'test_paid'].includes(order.status)) {
      await new OxaPayService(repository, new OxaPay(config)).reconcile(
        order.providerInvoiceId.slice('oxapay:'.length),
        order.orderId,
      );
    }
    res.json({ ok: true });
  }),
);

supportRouter.use(privateRouter);

supportRouter.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(error);
  // Do not echo provider payloads, keys or transaction details to clients or application logs.
  const invalid = error instanceof SyntaxError;
  res.status(invalid ? 400 : 503).json({ error: invalid ? 'invalid_request' : 'unavailable' });
});
