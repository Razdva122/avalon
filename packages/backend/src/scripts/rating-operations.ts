import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import type { VisualGameState } from '@avalon/types';
import type { PlayerTrueSkillChange } from '@avalon/types/stats/trueskill';
import { DEFAULT_MU, DEFAULT_SIGMA, calculateConservativeRating } from '@avalon/types/stats/trueskill-constants';
import { gameTrueSkillResultModel, playerTrueSkillRatingModel } from '@/db/models';
import { trueSkillCalculator } from './trueSkillCalculator';

type Values = {
  userID: string;
  mu: number;
  sigma: number;
  conservativeRating: number;
  gamesCount: number;
  gamesSinceReset: number;
  wins: number;
  losses: number;
  lastPlayedAt?: Date;
  lastResetAt?: Date;
};
type Operation = {
  _id: string;
  createdAt: Date;
  done: boolean;
  kind: 'game' | 'reset';
  game?: VisualGameState;
  userID?: string;
  months?: number;
  plan?: { players: Values[]; changes: PlayerTrueSkillChange[]; error?: string; nextResetAvailableAt?: Date };
  result?: { success: boolean; error?: string; nextResetAvailableAt?: Date };
};
type Controller = { _id: string; active: string | null; sequence: number };
let completeGame: (game: VisualGameState, sequence: number) => Promise<void> = async () => {};
export function setGameCompletionHandler(handler: typeof completeGame) {
  completeGame = handler;
}
function collections() {
  const db = mongoose.connection.db;
  if (!db) throw Error('Database unavailable');
  return {
    jobs: db.collection<Operation>('rating_operations'),
    controller: db.collection<Controller>('rating_controller'),
  };
}
export function nextResetDate(last: Date | undefined, months: number): Date | undefined {
  if (!last) return undefined;
  const next = new Date(last);
  const day = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + months);
  next.setUTCDate(Math.min(day, new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate()));
  return next;
}

// No expiring ownership lock: every worker can resume the SAME active operation.
// Advancing the durable controller is permitted only after all its side effects finish.
export async function drainRatingOperations(maximum = 100): Promise<void> {
  const { jobs, controller } = collections();
  await controller.updateOne({ _id: 'ratings' }, { $setOnInsert: { active: null, sequence: 0 } }, { upsert: true });
  for (let n = 0; n < maximum; n++) {
    let control = (await controller.findOne({ _id: 'ratings' }))!;
    if (!control.active) {
      const next = await jobs.findOne({ done: false }, { sort: { createdAt: 1, _id: 1 } });
      if (!next) return;
      const claimed = await controller.findOneAndUpdate(
        { _id: 'ratings', active: null, sequence: control.sequence },
        { $set: { active: next._id }, $inc: { sequence: 1 } },
        { returnDocument: 'after' },
      );
      if (!claimed) continue;
      control = claimed;
    }
    const job = await jobs.findOne({ _id: control.active! });
    if (!job) throw Error('Missing active rating operation');
    if (!job.done) await applyOperation(job, control.sequence);
    await controller.updateOne(
      { _id: 'ratings', active: control.active, sequence: control.sequence },
      { $set: { active: null } },
    );
  }
}

async function applyOperation(job: Operation, sequence: number) {
  const { jobs } = collections();
  if (!job.plan) {
    const ids = job.kind === 'game' ? job.game!.players.map((p) => p.id) : [job.userID!];
    const rows = await playerTrueSkillRatingModel.find({ userID: { $in: ids } }).lean();
    const ratings = new Map(rows.map((r) => [r.userID, r]));
    let plan: NonNullable<Operation['plan']>;
    if (job.kind === 'game') {
      const changes = trueSkillCalculator.calculateTrueSkillChangesForGame(job.game!, ratings).map((change) => ({
        ...change,
        gamesSinceReset: (ratings.get(change.userID)?.gamesSinceReset ?? 0) + 1,
      }));
      plan = {
        changes,
        players: changes.map((change) => {
          const before = ratings.get(change.userID);
          return {
            userID: change.userID,
            mu: change.newMu,
            sigma: change.newSigma,
            conservativeRating: calculateConservativeRating(change.newMu, change.newSigma),
            gamesCount: (before?.gamesCount ?? 0) + 1,
            gamesSinceReset: change.gamesSinceReset,
            wins: (before?.wins ?? 0) + Number(change.won),
            losses: (before?.losses ?? 0) + Number(!change.won),
            lastPlayedAt: job.createdAt,
          };
        }),
      };
    } else {
      const before = ratings.get(job.userID!);
      const next = nextResetDate(before?.lastResetAt, job.months!);
      plan = !before
        ? { players: [], changes: [], error: 'Player rating not found' }
        : next && next > job.createdAt
          ? { players: [], changes: [], error: 'Rating reset cooldown is active', nextResetAvailableAt: next }
          : {
              changes: [],
              nextResetAvailableAt: nextResetDate(job.createdAt, job.months!),
              players: [
                {
                  userID: before.userID,
                  mu: DEFAULT_MU,
                  sigma: DEFAULT_SIGMA,
                  conservativeRating: calculateConservativeRating(DEFAULT_MU, DEFAULT_SIGMA),
                  gamesCount: before.gamesCount,
                  gamesSinceReset: 0,
                  wins: before.wins,
                  losses: before.losses,
                  lastResetAt: job.createdAt,
                },
              ],
            };
    }
    await jobs.updateOne({ _id: job._id, done: false, plan: { $exists: false } }, { $set: { plan } });
    const stored = (await jobs.findOne({ _id: job._id }))!;
    if (stored.done) return;
    job = stored;
  }
  for (const values of job.plan!.players) {
    // Create missing players separately so a losing CAS can never upsert a duplicate.
    try {
      await playerTrueSkillRatingModel.updateOne(
        { userID: values.userID },
        { $setOnInsert: { userID: values.userID } },
        { upsert: true },
      );
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
    }
    await playerTrueSkillRatingModel.updateOne(
      { userID: values.userID, $or: [{ ratingSequence: { $exists: false } }, { ratingSequence: { $lt: sequence } }] },
      { $set: { ...values, ratingSequence: sequence } },
    );
  }
  if (job.kind === 'game') {
    await gameTrueSkillResultModel.updateOne(
      { gameID: job.game!.uuid },
      {
        $setOnInsert: {
          gameID: job.game!.uuid,
          playedAt: job.createdAt,
          playerChanges: job.plan!.changes,
        },
      },
      { upsert: true },
    );
    await completeGame(job.game!, sequence);
  }
  await jobs.updateOne(
    { _id: job._id, done: false },
    {
      $set: {
        done: true,
        result: {
          success: !job.plan!.error,
          ...(job.plan!.error ? { error: job.plan!.error } : {}),
          ...(job.plan!.nextResetAvailableAt ? { nextResetAvailableAt: job.plan!.nextResetAvailableAt } : {}),
        },
      },
      $unset: { plan: '', game: '' },
    },
  );
}

export async function applyGameRating(game: VisualGameState) {
  if (!game.result?.winner || game.result.reason === 'manualy') return;
  const { jobs } = collections();
  const id = `game:${game.uuid}`;
  // Legacy results are ambiguous: never silently charge them a second time.
  if (!(await jobs.findOne({ _id: id })) && (await gameTrueSkillResultModel.exists({ gameID: game.uuid }))) return;
  await jobs.updateOne(
    { _id: id },
    { $setOnInsert: { createdAt: new Date(), done: false, kind: 'game', game } },
    { upsert: true },
  );
  await drainRatingOperations();
  if (!(await jobs.findOne({ _id: id }))?.done) throw Error('Rating operation queued for retry');
}

export async function resetRating(userID: string, months: 1 | 3) {
  const { jobs } = collections();
  const id = `reset:${randomUUID()}`;
  await jobs.insertOne({ _id: id, createdAt: new Date(), done: false, kind: 'reset', userID, months });
  await drainRatingOperations();
  const job = await jobs.findOne({ _id: id });
  if (!job?.done) throw Error('Rating reset queued for retry');
  return job.result!;
}
