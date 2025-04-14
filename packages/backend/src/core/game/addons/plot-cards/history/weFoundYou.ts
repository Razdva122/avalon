import type { HistoryElement, THistoryData } from '@/core/game/history';
import type { THistoryStage } from '@avalon/types';
import type { IPlayerInGame } from '@/core/game';

export class WeFoundYouHistory implements HistoryElement<'weFoundYou'> {
  type = 'weFoundYou' as const;
  data: THistoryData['weFoundYou'];
  stage: THistoryStage;
  canBeHidden: boolean = true;

  constructor(owner: IPlayerInGame, selectedPlayer: IPlayerInGame) {
    this.data = {
      owner,
      selectedPlayer,
    };

    this.stage = 'finished';
  }

  dataForManager() {
    return {
      type: <const>'weFoundYou',
      ownerID: this.data.owner.userID,
      selectedPlayerID: this.data.selectedPlayer.userID,
    };
  }
}
