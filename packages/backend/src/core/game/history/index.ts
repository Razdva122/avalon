import { Game } from '@/core/game';
import { THistoryData, THistoryDataForManager } from '@/core/game/history/interface';
import type { THistoryType, THistoryStage } from '@avalon/types';

export * from '@/core/game/history/interface';

export abstract class HistoryElement<T extends THistoryType = THistoryType> {
  abstract type: T;
  abstract stage: THistoryStage;
  abstract data: THistoryData[T];

  /**
   * Data converted for frontend and database
   */
  abstract dataForManager(options: { game: Game; userID?: string }): THistoryDataForManager[T];
}
