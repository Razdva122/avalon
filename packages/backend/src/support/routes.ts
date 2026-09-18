import express, { Request, Response, NextFunction } from 'express';
import { authenticatedUser } from '@/user/sessions';
import { userFeaturesModel, userProfileModel } from '@/db/models';
import { hasPremium } from './premium';
import { supportOrderModel, supportTotalCents } from './repository';
import { publicDonation, SupportOrder } from './service';
import { DirectService, directSupport } from './direct/service';
import { formatAtomic } from './direct/protocol';

const asyncRoute =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };
export function privateOrder(order: SupportOrder) {
  const d = order.direct;
  return {
    id: order.orderId,
    amountUSD: order.amountCents / 100,
    status: order.status,
    createdAt: order.createdAt,
    network: d?.network,
    txid: d?.txid,
    address: d?.address,
    asset: order.payCurrency,
    amountCrypto: d?.amountAtomic === undefined ? undefined : formatAtomic(d.amountAtomic, d.decimals),
  };
}
export function createSupportRouter(service: DirectService) {
  const router = express.Router();
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  router.use(express.json({ limit: '8kb' }));
  router.get(
    '/',
    asyncRoute(async (_req, res) => {
      const [networks, orders] = await Promise.all([
        service.availableNetworks(),
        supportOrderModel
          .find({ provider: 'direct', status: 'finished', sandbox: false })
          .sort({ confirmedAt: -1, _id: -1 })
          .limit(10)
          .lean(),
      ]);
      const userIDs = orders.filter((o) => !o.anonymous).map((o) => o.userID);
      const [profiles, features] = await Promise.all([
        userProfileModel.find({ id: { $in: userIDs } }, { id: 1, name: 1, avatar: 1 }).lean(),
        userFeaturesModel.find({ userID: { $in: userIDs } }, { userID: 1, hideSupport: 1 }).lean(),
      ]);
      res.json({
        enabled: networks.length > 0,
        provider: 'direct',
        thresholdUSD: 10,
        networks,
        donations: orders.map((o) =>
          publicDonation(
            o,
            profiles.find((p) => p.id === o.userID) || null,
            features.find((f) => f.userID === o.userID)?.hideSupport === true,
          ),
        ),
      });
    }),
  );
  router.use(
    asyncRoute(async (req, res, next) => {
      const token = req.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
      if (!token) return res.status(401).json({ error: 'unauthorized' });
      let userID: string;
      try {
        const user = await authenticatedUser(token);
        if (typeof user.id !== 'string') throw new Error('invalid_user');
        userID = user.id;
      } catch {
        return res.status(401).json({ error: 'unauthorized' });
      }
      if (!(await userProfileModel.exists({ id: userID }))) return res.status(401).json({ error: 'unauthorized' });
      res.locals.userID = userID;
      next();
    }),
  );
  router.get(
    '/me',
    asyncRoute(async (_req, res) => {
      const userID = res.locals.userID as string;
      const [total, features, orders] = await Promise.all([
        supportTotalCents(userID),
        userFeaturesModel.findOne({ userID }).lean(),
        supportOrderModel.find({ userID, provider: 'direct' }).sort({ createdAt: -1 }).limit(20).lean(),
      ]);
      res.json({
        totalUSD: total / 100,
        premium: hasPremium(total, features),
        hideSupport: features?.hideSupport === true,
        showPremiumBadge: features?.showPremiumBadge !== false,
        orders: orders.map(privateOrder),
      });
    }),
  );
  router.patch(
    '/privacy',
    asyncRoute(async (req, res) => {
      const { hideSupport, showPremiumBadge } = req.body || {};
      if (typeof hideSupport !== 'boolean' || typeof showPremiumBadge !== 'boolean')
        return res.status(400).json({ error: 'invalid_privacy' });
      await userFeaturesModel.updateOne(
        { userID: res.locals.userID },
        { $set: { hideSupport, showPremiumBadge } },
        { upsert: true },
      );
      res.json({ ok: true });
    }),
  );
  router.post(
    '/transfers',
    asyncRoute(async (req, res) => {
      const { network, txid, anonymous } = req.body || {};
      if (typeof network !== 'string') return res.status(400).json({ error: 'invalid_network' });
      const order = await service.submit(res.locals.userID, network, txid, anonymous);
      res.json(privateOrder(order));
    }),
  );
  router.post(
    '/orders/:id/refresh',
    asyncRoute(async (req, res) => {
      if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return res.status(404).json({ error: 'not_found' });
      res.json(privateOrder(await service.refresh(req.params.id, res.locals.userID)));
    }),
  );
  router.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(error);
    const name = error instanceof SyntaxError ? 'invalid_request' : error instanceof Error ? error.message : '';
    const codes: Record<string, number> = {
      invalid_txid: 400,
      invalid_network: 400,
      invalid_request: 400,
      invalid_privacy: 400,
      already_claimed: 409,
      too_many_requests: 429,
      not_found: 404,
    };
    res.status(codes[name] || 503).json({ error: codes[name] ? name : 'unavailable' });
  });
  return router;
}
export const supportRouter = createSupportRouter(directSupport);
