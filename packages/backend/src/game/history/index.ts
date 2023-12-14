import { THistoryData } from '@/game/history/interface';
import type { THistoryType, THistoryStage } from '@avalon/types';

export * from '@/game/history/interface';

export abstract class HistoryElement<T extends THistoryType = THistoryType> {
	abstract type: T;
	abstract stage: THistoryStage;
	abstract data: THistoryData[T];
}
