import type { mongo } from 'mongoose';
import {
  ACHIEVEMENT_BEST_OF_THE_BEST,
  BEST_OF_THE_BEST_MIN_GAMES,
  BEST_OF_THE_BEST_RATING,
} from '@avalon/types/stats/achievements-constants';
import { DEFAULT_MU, DEFAULT_SIGMA } from '@avalon/types/stats/trueskill-constants';
import type { GameTrueSkillResult, PlayerTrueSkillRating, PlayerTrueSkillChange } from '@avalon/types/stats/trueskill';

type HistoryState = {
  gamesSinceReset: number;
  mu: number;
  sigma: number;
  playedAt: Date;
  qualifiedAt?: Date;
};

const same = (a: number, b: number) => Math.abs(a - b) < 1e-6;

type PendingOperation = {
  _id: string;
  kind: 'game' | 'reset';
  done: boolean;
  createdAt: Date;
  game?: { uuid: string };
  plan: { players: PlayerTrueSkillRating[]; changes: PlayerTrueSkillChange[] };
};

/** Run at startup before rating writers. Dry-run is read-only and returns only aggregate counts. */
export async function backfillBestOfTheBest(db: mongo.Db, apply = false) {
  const ratings = db.collection<PlayerTrueSkillRating>('playertrueskillratings');
  const current = await ratings
    .find({}, { projection: { userID: 1, mu: 1, sigma: 1, lastResetAt: 1, ratingSequence: 1 } })
    .toArray();
  const operations = db.collection<PendingOperation>('rating_operations');
  const pending = await operations.find({ done: false, plan: { $exists: true } }).toArray();
  const pendingGameIDs = new Set(pending.flatMap((job) => (job.game ? [job.game.uuid] : [])));
  const pendingResultCounts = new Map<string, Map<string, number>>();
  const resetsAt = new Map(current.map((r) => [r.userID, r.lastResetAt]));
  const states = new Map<string, HistoryState>();
  const summary = { players: 0, eligible: 0, granted: 0, resets: 0, gaps: 0, countersInitialized: 0 };
  const cursor = db
    .collection<GameTrueSkillResult>('gametrueskillresults')
    .find({}, { projection: { gameID: 1, playedAt: 1, playerChanges: 1 } })
    .sort({ playedAt: 1, _id: 1 });
  try {
    for await (const game of cursor) {
      const seen = new Set<string>();
      for (const change of game.playerChanges) {
        if (seen.has(change.userID)) throw new Error('Duplicate player in rating history; backfill not applied');
        seen.add(change.userID);
        if (
          ![change.oldMu, change.oldSigma, change.newMu, change.newSigma, game.playedAt?.getTime()].every(
            Number.isFinite,
          )
        )
          throw new Error('Invalid rating history; backfill not applied');
        const prior = states.get(change.userID);
        const lastReset = resetsAt.get(change.userID);
        const explicitReset = prior && lastReset && lastReset > prior.playedAt && lastReset <= game.playedAt;
        const resetSignature = prior && same(change.oldMu, DEFAULT_MU) && same(change.oldSigma, DEFAULT_SIGMA);
        const gap = prior && (!same(prior.mu, change.oldMu) || !same(prior.sigma, change.oldSigma));
        if (explicitReset || resetSignature) summary.resets++;
        else if (gap) summary.gaps++;
        // Unknown discontinuities start a new confirmed run too; never bridge missing history.
        const confirmedGames = (explicitReset || resetSignature || gap ? 0 : (prior?.gamesSinceReset ?? 0)) + 1;
        const gamesSinceReset =
          Number.isSafeInteger(change.gamesSinceReset) && change.gamesSinceReset! > 0
            ? change.gamesSinceReset!
            : confirmedGames;
        const qualified = gamesSinceReset >= BEST_OF_THE_BEST_MIN_GAMES && change.newMu >= BEST_OF_THE_BEST_RATING;
        if (pendingGameIDs.has(game.gameID)) {
          if (!pendingResultCounts.has(game.gameID)) pendingResultCounts.set(game.gameID, new Map());
          pendingResultCounts.get(game.gameID)!.set(change.userID, gamesSinceReset);
        }
        states.set(change.userID, {
          gamesSinceReset,
          mu: change.newMu,
          sigma: change.newSigma,
          playedAt: game.playedAt,
          qualifiedAt: prior?.qualifiedAt ?? (qualified ? game.playedAt : undefined),
        });
      }
    }
  } finally {
    await cursor.close();
  }
  summary.players = states.size;
  summary.eligible = [...states.values()].filter((s) => s.qualifiedAt).length;
  if (!apply) return summary;

  // A previous binary may have persisted (and partly applied) a plan without the counter.
  // Upgrade its immutable plan/result before draining; also initialize already-written players correctly.
  const control = await db
    .collection<{ _id: string; active: string | null; sequence: number }>('rating_controller')
    .findOne({ _id: 'ratings' });
  const appliedPendingCounts = new Map<string, number>();
  for (const job of pending) {
    const counts = new Map<string, number>();
    for (const values of job.plan.players) {
      const state = states.get(values.userID);
      const change = job.plan.changes.find((p) => p.userID === values.userID);
      const lastReset = resetsAt.get(values.userID);
      const resetBeforeJob = lastReset && state && lastReset >= state.playedAt && lastReset <= job.createdAt;
      const continuous =
        state && change && !resetBeforeJob && same(state.mu, change.oldMu) && same(state.sigma, change.oldSigma);
      const count =
        values.gamesSinceReset ??
        (job.kind === 'reset'
          ? 0
          : (pendingResultCounts.get(job.game!.uuid)?.get(values.userID) ??
            (continuous ? state.gamesSinceReset : 0) + 1));
      values.gamesSinceReset = count;
      counts.set(values.userID, count);
      if (
        control?.active === job._id &&
        current.some((r) => r.userID === values.userID && r.ratingSequence === control.sequence)
      )
        appliedPendingCounts.set(values.userID, count);
    }
    for (const change of job.plan.changes) change.gamesSinceReset = counts.get(change.userID);
    await operations.updateOne(
      { _id: job._id, done: false },
      {
        $set: {
          'plan.players': job.plan.players,
          'plan.changes': job.plan.changes,
        },
      },
    );
    if (job.kind === 'game' && pendingResultCounts.has(job.game!.uuid)) {
      for (const [userID, count] of counts) {
        await db
          .collection('gametrueskillresults')
          .updateOne(
            { gameID: job.game!.uuid },
            { $set: { 'playerChanges.$[player].gamesSinceReset': count } },
            { arrayFilters: [{ 'player.userID': userID }] },
          );
      }
    }
  }

  // Initialize only missing counters: retrying the backfill cannot overwrite live progress.
  for (let start = 0; start < current.length; start += 500) {
    const result = await ratings.bulkWrite(
      current.slice(start, start + 500).map((r) => {
        const state = states.get(r.userID);
        const resetAfterGame = r.lastResetAt && state && r.lastResetAt >= state.playedAt;
        const continuous = state && !resetAfterGame && same(r.mu, state.mu) && same(r.sigma, state.sigma);
        return {
          updateOne: {
            filter: { userID: r.userID, gamesSinceReset: { $exists: false } },
            update: {
              $set: { gamesSinceReset: appliedPendingCounts.get(r.userID) ?? (continuous ? state.gamesSinceReset : 0) },
            },
          },
        };
      }),
    );
    summary.countersInitialized += result.modifiedCount;
  }
  const awards = db.collection('userachievements');
  for (const [userID, state] of states) {
    if (!state.qualifiedAt) continue;
    const result = await awards.updateOne(
      { userID, achievementID: ACHIEVEMENT_BEST_OF_THE_BEST },
      [
        {
          $set: {
            userID: { $literal: userID },
            achievementID: ACHIEVEMENT_BEST_OF_THE_BEST,
            completedAt: { $cond: ['$completed', '$completedAt', state.qualifiedAt] },
            updatedAt: { $cond: ['$completed', '$updatedAt', '$$NOW'] },
            completed: true,
            currentProgress: 1,
            state: { $ifNull: ['$state', {}] },
          },
        },
      ],
      { upsert: true },
    );
    summary.granted += result.upsertedCount + result.modifiedCount;
  }
  const totalUsers = await db.collection('userfeatures').countDocuments({ lastGameDate: { $exists: true } });
  const completedUsers = await awards.countDocuments({ achievementID: ACHIEVEMENT_BEST_OF_THE_BEST, completed: true });
  await db.collection('achievementstats').updateOne(
    { achievementID: ACHIEVEMENT_BEST_OF_THE_BEST },
    {
      $set: {
        achievementID: ACHIEVEMENT_BEST_OF_THE_BEST,
        totalUsers,
        completedUsers,
        completionPercentage: totalUsers ? (completedUsers / totalUsers) * 100 : 0,
      },
    },
    { upsert: true },
  );
  return summary;
}
