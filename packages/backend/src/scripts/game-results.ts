import type { StartedRoomState, VisualGameState } from '@avalon/types';
import { DBManager } from '@/db';
import { roomModel } from '@/db/models';
import { updateTrueSkillForGame } from './updateTrueSkillRatings';
import { drainRatingOperations, setGameCompletionHandler } from './rating-operations';

/** The archive is the durable outbox; memory only covers a failed initial insert. */
export class GameResultWorker {
  private pending = new Map<string, StartedRoomState>();
  private running?: Promise<void>;
  constructor(
    private db: DBManager,
    achievements: (game: VisualGameState, sequence: number) => Promise<void>,
  ) {
    setGameCompletionHandler(async (game, sequence) => {
      await achievements(game, sequence);
    });
  }
  submit(state: StartedRoomState): Promise<void> {
    this.pending.set(state.roomID, structuredClone(state));
    return this.flush();
  }
  flush(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.run().finally(() => {
      this.running = undefined;
    });
    return this.running;
  }
  private async run() {
    for (const [id, state] of this.pending) {
      await this.db.saveRoomToDB(state);
      this.pending.delete(id);
    }
    await drainRatingOperations();
    const pending = await roomModel
      .find({ completionPending: true }, { roomID: 1, startAt: 1, players: 1, game: 1 })
      .sort({ _id: 1 })
      .limit(20)
      .maxTimeMS(10000)
      .lean();
    for (const state of pending) {
      await this.db.updateLastGameDate(
        state.players.map((p) => p.id),
        new Date(state.startAt),
      );
      await updateTrueSkillForGame(state.game);
      await roomModel.updateOne({ roomID: state.roomID }, { $set: { completionPending: false } });
    }
  }
}
