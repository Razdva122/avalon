import express, { Request, Response, NextFunction } from 'express';
import { authenticatedUser } from '@/user/sessions';
import { userProfileModel } from '@/db/models';
import { boardKind, boardQuery, reportReason, validateBoardDraft } from './validation';
import {
  bannedBoardUsers,
  boardAction,
  boardDTOs,
  boardListingModel,
  boardReportModel,
  listingID,
  moderationBoards,
  ownerBoards,
  publicBoards,
  publishBoard,
  reportBoard,
  setBoardBan,
} from './repository';

const asyncRoute =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };
export function createPlayerBoardsRouter(now = () => new Date()) {
  const router = express.Router();
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    next();
  });
  router.use(express.json({ limit: '8kb' }));
  router.get(
    '/',
    asyncRoute(async (req, res) => {
      const { kind, language, page } = boardQuery(req.query);
      res.json(await publicBoards(kind, language, page, now()));
    }),
  );
  router.use(
    asyncRoute(async (req, res, next) => {
      const token = req.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
      if (!token) return res.status(401).json({ error: 'unauthorized' });
      try {
        res.locals.userID = (await authenticatedUser(token)).id;
      } catch {
        return res.status(401).json({ error: 'unauthorized' });
      }
      next();
    }),
  );
  router.get(
    '/me',
    asyncRoute(async (_req, res) => {
      res.json(await ownerBoards(res.locals.userID));
    }),
  );
  router.put(
    '/me/:kind',
    asyncRoute(async (req, res) => {
      const draft = validateBoardDraft(req.body, boardKind(req.params.kind));
      const time = now();
      const listing = await publishBoard(res.locals.userID, draft, time);
      res.json({ listing: (await boardDTOs([listing]))[0] });
    }),
  );
  router.post(
    '/me/:kind/:action',
    asyncRoute(async (req, res) => {
      const time = now();
      const listing = await boardAction(res.locals.userID, boardKind(req.params.kind), req.params.action, time);
      res.json({ listing: (await boardDTOs([listing]))[0] });
    }),
  );
  router.post(
    '/:id/report',
    asyncRoute(async (req, res) => {
      if (!req.body || Object.keys(req.body).some((key) => key !== 'reason')) throw Error('invalid_report');
      await reportBoard(req.params.id, res.locals.userID, reportReason(req.body.reason), now());
      res.json({ ok: true });
    }),
  );
  router.use(
    '/moderation',
    asyncRoute(async (_req, res, next) => {
      if (!(await userProfileModel.exists({ id: res.locals.userID, isAdmin: true })))
        return res.status(403).json({ error: 'forbidden' });
      next();
    }),
  );
  router.get(
    '/moderation/bans',
    asyncRoute(async (_req, res) => {
      res.json({ users: await bannedBoardUsers() });
    }),
  );
  router.get(
    '/moderation',
    asyncRoute(async (_req, res) => {
      res.json({ reports: await moderationBoards() });
    }),
  );
  router.post(
    '/moderation/:id/hide',
    asyncRoute(async (req, res) => {
      const result = await boardListingModel.updateOne(
        { _id: listingID(req.params.id), createdAt: { $exists: true } },
        { $set: { active: false, moderated: true } },
      );
      if (!result.matchedCount) throw Error('not_found');
      res.json({ ok: true });
    }),
  );
  router.post(
    '/moderation/:id/dismiss',
    asyncRoute(async (req, res) => {
      const id = listingID(req.params.id);
      if (!(await boardListingModel.exists({ _id: id, createdAt: { $exists: true } }))) throw Error('not_found');
      await boardReportModel.deleteMany({ listingID: id });
      res.json({ ok: true });
    }),
  );
  router.post(
    '/moderation/users/:userID/ban',
    asyncRoute(async (req, res) => {
      if (!req.body || typeof req.body.banned !== 'boolean' || Object.keys(req.body).some((key) => key !== 'banned'))
        throw Error('invalid_ban');
      if (
        !/^[A-Za-z0-9-]{1,80}$/.test(req.params.userID) ||
        !(await userProfileModel.exists({ id: req.params.userID }))
      )
        throw Error('not_found');
      await setBoardBan(req.params.userID, req.body.banned);
      res.json({ ok: true });
    }),
  );
  router.use((_req, res) => {
    res.status(404).json({ error: 'not_found' });
  });
  router.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(error);
    const name = error instanceof SyntaxError ? 'invalid_request' : error instanceof Error ? error.message : '';
    const invalid = [
      'invalid_kind',
      'invalid_draft',
      'invalid_languages',
      'invalid_days',
      'invalid_hours',
      'invalid_timezone',
      'invalid_communication',
      'invalid_experience',
      'invalid_group_size',
      'invalid_group_name',
      'invalid_contacts',
      'invalid_page',
      'invalid_action',
      'invalid_report',
      'invalid_ban',
      'invalid_request',
    ];
    const codes: Record<string, number> = {
      not_found: 404,
      board_banned: 403,
      recruitment_ineligible: 403,
      board_moderated: 403,
      cooldown: 409,
      listing_inactive: 409,
      listing_active: 409,
    };
    const status = invalid.includes(name) ? 400 : (codes[name] ?? 503);
    const tooLarge =
      typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.too.large';
    res
      .status(tooLarge ? 413 : status)
      .json({ error: tooLarge ? 'invalid_request' : status === 503 ? 'unavailable' : name });
  });
  return router;
}
export const playerBoardsRouter = createPlayerBoardsRouter();
