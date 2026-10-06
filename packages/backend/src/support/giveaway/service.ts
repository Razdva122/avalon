import { randomInt, randomUUID } from 'node:crypto';
import { GiveawayState, GiveawayWinner } from '@avalon/types/giveaway';
import { userFeaturesModel, userProfileModel } from '@/db/models';
import { boardAuthorModel, boardListingModel } from '@/player-boards/repository';
import { supportOrderModel } from '../repository';
import { hasPremium } from '../premium';
import { giveawayDrawModel, giveawayScheduleModel, StoredDraw } from './repository';
import { nextSunday, WEEK } from './schedule';

const SCHEDULE = 'weekly-premium';
const LEASE_MS = 5 * 60 * 1000;
function duplicate(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
async function grantPremium(userID: string, at: Date) {
  try {
    await userFeaturesModel.updateOne({ userID }, { $setOnInsert: { userID } }, { upsert: true });
  } catch (error) {
    if (!duplicate(error)) throw error;
  }
  // An interrupted retry must not move the original lifetime-grant date or alter privacy.
  await userFeaturesModel.updateOne(
    { userID, premiumGrantedAt: null },
    {
      $set: { premiumGrantedAt: at, premiumGrantReason: 'weekly-giveaway' },
    },
  );
}
export class GiveawayService {
  private readonly now: () => Date;
  private readonly random: (max: number) => number;
  private readonly grant: (id: string, at: Date) => Promise<void>;
  constructor(
    options: {
      now?: () => Date;
      random?: (max: number) => number;
      grant?: (id: string, at: Date) => Promise<void>;
    } = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.random = options.random ?? randomInt;
    this.grant = options.grant ?? grantPremium;
  }
  async initialize(): Promise<void> {
    const now = this.now();
    try {
      await giveawayScheduleModel.updateOne(
        { _id: SCHEDULE },
        { $setOnInsert: { initializedAt: now, nextDrawAt: nextSunday(now) } },
        { upsert: true },
      );
    } catch (error) {
      if (!duplicate(error)) throw error;
    }
  }
  private async select(drawAt: Date): Promise<Pick<StoredDraw, 'solo' | 'group'>> {
    // ponytail: materialize eligible tickets once weekly; use reservoir sampling if board scale warrants it.
    const listings = await boardListingModel
      .find({
        active: true,
        moderated: false,
        publishingBlocked: false,
        createdAt: { $lte: drawAt },
        bumpedAt: { $lte: drawAt },
        expiresAt: { $gt: drawAt },
        kind: { $in: ['solo', 'group'] },
      })
      .sort({ _id: 1 })
      .lean();
    const userIDs = [...new Set(listings.flatMap((item) => [item.userID, ...(item.memberIDs ?? [])]))];
    const [profiles, bans, features, totals] = await Promise.all([
      userProfileModel.find({ id: { $in: userIDs } }, { id: 1, name: 1, avatar: 1 }).lean(),
      boardAuthorModel.find({ userID: { $in: userIDs }, banned: true }, { userID: 1 }).lean(),
      userFeaturesModel.find({ userID: { $in: userIDs } }, { userID: 1, premiumGrantedAt: 1 }).lean(),
      supportOrderModel.aggregate<{ _id: string; total: number }>([
        { $match: { userID: { $in: userIDs }, provider: 'direct', status: 'finished', sandbox: false } },
        { $group: { _id: '$userID', total: { $sum: '$amountCents' } } },
      ]),
    ]);
    const profileByID = new Map(profiles.map((p) => [p.id, p]));
    const banned = new Set(bans.map((b) => b.userID));
    const featuresByID = new Map(features.map((f) => [f.userID, f]));
    const totalsByID = new Map(totals.map((t) => [t._id, t.total]));
    const eligible = (id: string) =>
      profileByID.has(id) && !banned.has(id) && !hasPremium(totalsByID.get(id) ?? 0, featuresByID.get(id));
    const publicWinner = (id: string): GiveawayWinner => {
      const p = profileByID.get(id)!;
      return { userID: id, name: p.name, avatar: p.avatar ?? 'servant' };
    };
    const active = listings.filter((l) => profileByID.has(l.userID) && !banned.has(l.userID));
    const solos = active.filter((l) => l.kind === 'solo' && eligible(l.userID));
    const solo = solos.length ? publicWinner(solos[this.random(solos.length)].userID) : null;
    const groups = active
      .filter((l) => l.kind === 'group')
      .map((listing) => ({
        listing,
        members: [...new Set(listing.memberIDs?.length ? listing.memberIDs : [listing.userID])].filter(
          (id) => id !== solo?.userID && eligible(id),
        ),
      }))
      .filter((g) => g.members.length > 0);
    const ticket = groups.length ? groups[this.random(groups.length)] : null;
    const group = ticket
      ? { ...publicWinner(ticket.members[this.random(ticket.members.length)]), groupName: ticket.listing.groupName }
      : null;
    return { solo, group };
  }
  private async advance(drawAt: Date) {
    await giveawayScheduleModel.updateOne(
      { _id: SCHEDULE, nextDrawAt: drawAt },
      { $set: { nextDrawAt: new Date(drawAt.getTime() + WEEK) } },
    );
  }
  async processOne(): Promise<boolean> {
    const now = this.now();
    const schedule = await giveawayScheduleModel.findById(SCHEDULE).lean();
    if (!schedule || schedule.nextDrawAt.getTime() > now.getTime()) return false;
    const drawAt = schedule.nextDrawAt;
    const id = drawAt.toISOString();
    try {
      await giveawayDrawModel.updateOne(
        { _id: id },
        { $setOnInsert: { drawAt, status: 'pending', solo: null, group: null } },
        { upsert: true },
      );
    } catch (error) {
      if (!duplicate(error)) throw error;
    }
    if (await giveawayDrawModel.exists({ _id: id, status: 'completed' })) {
      await this.advance(drawAt);
      return true;
    }
    const leaseToken = randomUUID();
    let draw = await giveawayDrawModel
      .findOneAndUpdate(
        {
          _id: id,
          status: { $ne: 'completed' },
          $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lte: now } }],
        },
        { $set: { leaseToken, leaseUntil: new Date(now.getTime() + LEASE_MS) } },
        { returnDocument: 'after' },
      )
      .lean();
    if (!draw) return false;
    const owned = () => ({
      _id: id,
      leaseToken,
      leaseUntil: { $gt: this.now() },
      status: { $ne: 'completed' as const },
    });
    try {
      if (draw.status === 'pending') {
        const selected = await this.select(drawAt);
        draw = await giveawayDrawModel
          .findOneAndUpdate(owned(), { $set: { ...selected, status: 'selected' } }, { returnDocument: 'after' })
          .lean();
        if (!draw) return false;
      }
      for (const winner of [draw.solo, draw.group]) {
        if (!winner) continue;
        if (!(await giveawayDrawModel.exists(owned()))) return false;
        await this.grant(winner.userID, drawAt);
      }
      const result = await giveawayDrawModel.updateOne(owned(), {
        $set: { status: 'completed', completedAt: this.now() },
        $unset: { leaseToken: '', leaseUntil: '' },
      });
      if (!result.modifiedCount) return false;
      await this.advance(drawAt);
      return true;
    } catch (error) {
      await giveawayDrawModel.updateOne({ _id: id, leaseToken }, { $unset: { leaseToken: '', leaseUntil: '' } });
      throw error;
    }
  }
}
export async function publicGiveaway(): Promise<GiveawayState> {
  const [schedule, draw] = await Promise.all([
    giveawayScheduleModel.findById(SCHEDULE).lean(),
    giveawayDrawModel.findOne({ status: 'completed' }).sort({ drawAt: -1 }).lean(),
  ]);
  if (!schedule) throw Error('unavailable');
  // Explicit projection never exposes lease state or database metadata.
  const winner = (value: GiveawayWinner | null) =>
    value ? { userID: value.userID, name: value.name, avatar: value.avatar } : null;
  return {
    nextDrawAt: schedule.nextDrawAt.toISOString(),
    timeZone: 'Asia/Yekaterinburg',
    latestDraw: draw
      ? {
          drawAt: draw.drawAt.toISOString(),
          solo: winner(draw.solo),
          group: draw.group ? { ...winner(draw.group)!, groupName: draw.group.groupName } : null,
        }
      : null,
  };
}
export const weeklyGiveaway = new GiveawayService();
