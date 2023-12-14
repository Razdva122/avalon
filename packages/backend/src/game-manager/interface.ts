import type { THistoryResults, TVisibleRole } from '@avalon/types';
import type { IGameSettings, TGameStage, IPlayerFeatures} from '@/game';

export interface IVisualGameState {
	stage: TGameStage;
	settings: IGameSettings;
	history: THistoryResults;
	players: IVisualPlayer[];
}

export interface IVisualPlayer {
	id: string;
	name: string;
	role: TVisibleRole;
	features: IPlayerFeatures & {
		waitForAction: boolean;
	}
}
