import type { THistoryResults, IPlayer } from '@avalon/types';
import type { IGameSettings, TGameStage} from '@/game';

export interface IVisualGameState {
	stage: TGameStage;
	settings: IGameSettings;
	history: THistoryResults;
	players: IPlayer[];
}
