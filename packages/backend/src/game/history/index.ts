import { THistoryData, THistoryDataForManager } from '@/game/history/interface';
import type { THistoryType, THistoryStage, Dictionary } from '@avalon/types';

export * from '@/game/history/interface';

export abstract class HistoryElement<T extends THistoryType = THistoryType> {
  abstract type: T;
  abstract stage: THistoryStage;
  abstract data: THistoryData[T];

  /**
   * Data converted for frontend and database
   */
  abstract dataForManager(options: Dictionary<unknown>): THistoryDataForManager[T];
}
