import mongoose, { Schema, Types } from 'mongoose';
import { BoardDraft, BoardKind, BoardListing, BoardReport, BoardReportReason } from '@avalon/types/player-board';
import { roomModel, userProfileModel } from '@/db/models';

const DAY = 86400000;
const COOLDOWN = 7 * DAY;
const LIFETIME = 30 * DAY;
export interface StoredBoard extends BoardDraft {
  _id: Types.ObjectId;
  userID: string;
  createdAt?: Date;
  bumpedAt?: Date;
  expiresAt?: Date;
  active: boolean;
  moderated: boolean;
  publishingBlocked: boolean;
}
const schema = new Schema<StoredBoard>({
  userID: { type: String, required: true },
  kind: { type: String, required: true, enum: ['solo', 'group'] },
  languages: [String],
  otherLanguage: { type: String, maxlength: 60 },
  scheduleEnabled: Boolean,
  days: [Number],
  startHour: Number,
  endHour: Number,
  timeZone: String,
  communication: String,
  experience: String,
  beginnerFriendly: Boolean,
  canTeach: Boolean,
  groupName: { type: String, maxlength: 60, default: '' },
  groupSize: Number,
  memberIDs: { type: [String], default: [] },

  contacts: [{ _id: false, type: { type: String }, value: String }],
  createdAt: Date,
  bumpedAt: Date,
  expiresAt: Date,
  active: { type: Boolean, default: false },
  moderated: { type: Boolean, default: false },
  publishingBlocked: { type: Boolean, default: false },
});
schema.index({ userID: 1, kind: 1 }, { unique: true });
schema.index({ kind: 1, active: 1, publishingBlocked: 1, bumpedAt: -1, _id: -1 });
schema.index({ kind: 1, languages: 1, active: 1, bumpedAt: -1, _id: -1 });
export const boardListingModel = mongoose.model<StoredBoard>('PlayerBoardListing', schema);
interface StoredReport {
  listingID: Types.ObjectId;
  reporterID: string;
  reasons: BoardReportReason[];
  createdAt: Date;
}
const reportSchema = new Schema<StoredReport>({
  listingID: { type: Schema.Types.ObjectId, required: true },
  reporterID: { type: String, required: true },
  reasons: [String],
  createdAt: { type: Date, required: true },
});
reportSchema.index({ listingID: 1, reporterID: 1 }, { unique: true });
export const boardReportModel = mongoose.model<StoredReport>('PlayerBoardReport', reportSchema);
interface BoardAuthor {
  userID: string;
  banned: boolean;
}
const authorSchema = new Schema<BoardAuthor>({
  userID: { type: String, required: true, unique: true },
  banned: { type: Boolean, required: true, default: false },
});
export const boardAuthorModel = mongoose.model<BoardAuthor>('PlayerBoardAuthor', authorSchema);
export async function ensurePlayerBoardIndexes() {
  // connectDB disables automatic indexes; startup must create these explicitly.
  await Promise.all([
    boardListingModel.createIndexes(),
    boardReportModel.createIndexes(),
    boardAuthorModel.createIndexes(),
  ]);
}
function duplicate(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
export function listingID(value: string) {
  if (!/^[a-f0-9]{24}$/i.test(value)) throw Error('not_found');
  return new Types.ObjectId(value);
}
export async function isBoardBanned(userID: string) {
  return Boolean(await boardAuthorModel.exists({ userID, banned: true }));
}
export async function canRecruit(userID: string) {
  return Boolean(
    await roomModel.exists({
      'players.id': userID,
      'game.stage': 'end',
      'game.result.winner': { $in: ['good', 'evil'] },
      'game.result.reason': { $exists: true, $ne: 'manualy' },
    }),
  );
}
async function requirePublishing(userID: string, kind: BoardKind) {
  if (await isBoardBanned(userID)) throw Error('board_banned');
  if (kind === 'group' && !(await canRecruit(userID))) throw Error('recruitment_ineligible');
}
async function ensureSlot(userID: string, kind: BoardKind) {
  try {
    await boardListingModel.updateOne(
      { userID, kind },
      { $setOnInsert: { userID, kind, active: false, moderated: false, publishingBlocked: false } },
      { upsert: true },
    );
  } catch (error) {
    if (!duplicate(error)) throw error;
  }
}
export async function setBoardBan(userID: string, banned: boolean) {
  // Materialize both unique slots first. Future first publications update the same
  // documents and cannot race a ban by inserting a new unblocked document.
  await Promise.all([ensureSlot(userID, 'solo'), ensureSlot(userID, 'group')]);
  if (banned) await boardListingModel.updateMany({ userID }, { $set: { publishingBlocked: true } });
  await boardAuthorModel.updateOne({ userID }, { $set: { banned } }, { upsert: true });
  if (!banned) await boardListingModel.updateMany({ userID }, { $set: { publishingBlocked: false } });
}
export async function publishBoard(userID: string, draft: BoardDraft, now: Date): Promise<StoredBoard> {
  const memberIDs = draft.memberIDs ?? [];
  if ((await userProfileModel.countDocuments({ id: { $in: memberIDs } })) !== memberIDs.length)
    throw Error('invalid_members');
  draft = { ...draft, memberIDs };
  await requirePublishing(userID, draft.kind);
  await ensureSlot(userID, draft.kind);
  let listing = await boardListingModel
    .findOneAndUpdate(
      { userID, kind: draft.kind, publishingBlocked: false, moderated: false, createdAt: { $exists: false } },
      {
        $set: { ...draft, createdAt: now, bumpedAt: now, expiresAt: new Date(now.getTime() + LIFETIME), active: true },
      },
      { returnDocument: 'after' },
    )
    .lean();
  if (!listing)
    listing = await boardListingModel
      .findOneAndUpdate(
        { userID, kind: draft.kind, publishingBlocked: false, moderated: false, createdAt: { $exists: true } },
        { $set: draft },
        { returnDocument: 'after' },
      )
      .lean();
  if (!listing) {
    const current = await boardListingModel.findOne({ userID, kind: draft.kind }).lean();
    throw Error(current?.moderated ? 'board_moderated' : 'board_banned');
  }
  if (await isBoardBanned(userID)) throw Error('board_banned');
  return listing;
}
export async function boardAction(userID: string, kind: BoardKind, action: string, now: Date): Promise<StoredBoard> {
  if (!['hide', 'bump', 'reactivate'].includes(action)) throw Error('invalid_action');
  if (action !== 'hide') await requirePublishing(userID, kind);
  const owner = { userID, kind, createdAt: { $exists: true } };
  const item = await boardListingModel.findOne(owner).lean();
  if (!item) throw Error('not_found');
  if (action !== 'hide' && item.moderated) throw Error('board_moderated');
  if (action !== 'hide' && item.publishingBlocked) throw Error('board_banned');
  const restoreHidden = action === 'reactivate' && !item.active && item.expiresAt!.getTime() > now.getTime();
  const filter =
    action === 'hide'
      ? owner
      : {
          ...owner,
          publishingBlocked: false,
          moderated: false,
          ...(restoreHidden
            ? { active: false, expiresAt: { $gt: now } }
            : {
                bumpedAt: { $lte: new Date(now.getTime() - COOLDOWN) },
                ...(action === 'bump' ? { active: true, expiresAt: { $gt: now } } : { expiresAt: { $lte: now } }),
              }),
        };
  const update =
    action === 'hide'
      ? { active: false }
      : restoreHidden
        ? { active: true }
        : action === 'bump'
          ? { bumpedAt: now, expiresAt: new Date(now.getTime() + LIFETIME) }
          : { active: true, bumpedAt: now, expiresAt: new Date(now.getTime() + LIFETIME) };
  const listing = await boardListingModel
    .findOneAndUpdate(filter, { $set: update }, { returnDocument: 'after' })
    .lean();
  if (!listing) {
    const current = await boardListingModel.findOne(owner).lean();
    if (current?.publishingBlocked) throw Error('board_banned');
    if (current?.moderated) throw Error('board_moderated');
    if (action === 'bump' && (!current?.active || current.expiresAt!.getTime() <= now.getTime()))
      throw Error('listing_inactive');
    if (action === 'reactivate' && current?.active && current.expiresAt!.getTime() > now.getTime())
      throw Error('listing_active');
    throw Error('cooldown');
  }
  return listing;
}
export async function boardDTOs(items: StoredBoard[]): Promise<BoardListing[]> {
  const profiles = await userProfileModel
    .find({ id: { $in: items.flatMap((i) => [i.userID, ...(i.memberIDs ?? [])]) } }, { id: 1, name: 1, avatar: 1 })
    .lean();
  return items.map((item) => {
    const profile = profiles.find((p) => p.id === item.userID);
    return {
      id: item._id.toString(),
      userID: item.userID,
      name: profile?.name ?? 'Player',
      avatar: profile?.avatar ?? 'servant',
      kind: item.kind,
      languages: [...item.languages],
      otherLanguage: item.otherLanguage,
      scheduleEnabled: item.scheduleEnabled,
      days: [...item.days],
      startHour: item.startHour,
      endHour: item.endHour,
      timeZone: item.timeZone,
      communication: item.communication,
      experience: item.experience,
      beginnerFriendly: item.beginnerFriendly,
      canTeach: item.canTeach,
      groupName: item.groupName,
      groupSize: item.groupSize,
      memberIDs: [...(item.memberIDs ?? [])],
      members: (item.memberIDs ?? []).flatMap((id) => {
        const member = profiles.find((p) => p.id === id);
        return member ? [{ userID: member.id, name: member.name, avatar: member.avatar ?? 'servant' }] : [];
      }),

      contacts: item.contacts.map(({ type, value }) => ({ type, value })),
      createdAt: item.createdAt!.toISOString(),
      bumpedAt: item.bumpedAt!.toISOString(),
      expiresAt: item.expiresAt!.toISOString(),
      active: item.active,
      moderated: item.moderated,
    };
  });
}
export async function searchBoardMembers(value: unknown) {
  if (typeof value !== 'string' || value.length > 80 || value.trim().length < 2 || /[\x00-\x1f\x7f]/.test(value))
    throw Error('invalid_members');
  const prefix = value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const profiles = await userProfileModel
    .find({ name: new RegExp('^' + prefix, 'i') }, { id: 1, name: 1, avatar: 1 })
    .sort({ name: 1, id: 1 })
    .limit(10)
    .maxTimeMS(2000)
    .lean();
  return { members: profiles.map((p) => ({ userID: p.id, name: p.name, avatar: p.avatar ?? 'servant' })) };
}
export async function publicBoards(kind: BoardKind, language: string | undefined, page: number, now: Date) {
  const items = await boardListingModel
    .aggregate<StoredBoard>([
      {
        $match: {
          kind,
          active: true,
          moderated: false,
          publishingBlocked: false,
          expiresAt: { $gt: now },
          ...(language ? { languages: language } : {}),
        },
      },
      { $sort: { bumpedAt: -1, _id: -1 } },
      {
        $lookup: { from: boardAuthorModel.collection.name, localField: 'userID', foreignField: 'userID', as: 'author' },
      },
      { $match: { 'author.banned': { $ne: true } } },
      { $skip: (page - 1) * 20 },
      { $limit: 21 },
      { $unset: 'author' },
    ])
    .option({ maxTimeMS: 10000 });
  return { listings: await boardDTOs(items.slice(0, 20)), hasMore: items.length > 20 };
}
export async function ownerBoards(userID: string) {
  const [items, banned, eligible, profile] = await Promise.all([
    boardListingModel
      .find({ userID, createdAt: { $exists: true } })
      .sort({ kind: -1 })
      .lean(),
    isBoardBanned(userID),
    canRecruit(userID),
    userProfileModel.findOne({ id: userID }, { isAdmin: 1 }).lean(),
  ]);
  return { listings: await boardDTOs(items), banned, canRecruit: eligible, isAdmin: profile?.isAdmin === true };
}
export async function reportBoard(id: string, reporterID: string, reason: BoardReportReason, now: Date) {
  const listing = await boardListingModel
    .findOne({ _id: listingID(id), active: true, moderated: false, publishingBlocked: false, expiresAt: { $gt: now } })
    .lean();
  if (!listing || (await isBoardBanned(listing.userID))) throw Error('not_found');
  const filter = { listingID: listing._id, reporterID };
  const update = { $setOnInsert: { ...filter, createdAt: now }, $addToSet: { reasons: reason } };
  try {
    await boardReportModel.updateOne(filter, update, { upsert: true });
  } catch (error) {
    if (!duplicate(error)) throw error;
    await boardReportModel.updateOne(filter, { $addToSet: { reasons: reason } });
  }
}
export async function moderationBoards(): Promise<BoardReport[]> {
  const groups = await boardReportModel.aggregate<{
    _id: Types.ObjectId;
    reasons: BoardReportReason[][];
    count: number;
  }>([
    { $group: { _id: '$listingID', reasons: { $push: '$reasons' }, count: { $sum: 1 } } },
    { $sort: { count: -1, _id: -1 } },
    { $limit: 100 },
  ]);
  const items = await boardListingModel
    .find({ _id: { $in: groups.map((g) => g._id) }, createdAt: { $exists: true } })
    .lean();
  const listings = await boardDTOs(items);
  const authors = await boardAuthorModel.find({ userID: { $in: items.map((i) => i.userID) }, banned: true }).lean();
  return groups.flatMap((group) => {
    const listing = listings.find((i) => i.id === group._id.toString());
    return listing
      ? [
          {
            id: listing.id,
            listing,
            reasons: [...new Set(group.reasons.flat())],
            count: group.count,
            banned: authors.some((a) => a.userID === listing.userID),
          },
        ]
      : [];
  });
}

export async function bannedBoardUsers(): Promise<{ userID: string; name: string }[]> {
  const authors = await boardAuthorModel.find({ banned: true }).sort({ userID: 1 }).lean();
  const profiles = await userProfileModel
    .find({ id: { $in: authors.map((author) => author.userID) } }, { id: 1, name: 1 })
    .lean();
  return authors.map((author) => ({
    userID: author.userID,
    name: profiles.find((profile) => profile.id === author.userID)?.name ?? 'Player',
  }));
}
