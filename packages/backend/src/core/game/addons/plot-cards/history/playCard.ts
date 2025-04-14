import type { HistoryElement, THistoryData } from '@/core/game/history';
import type { THistoryStage, TPlotCardNames } from '@avalon/types';
import type { IPlayerInGame } from '@/core/game';

export class PlayCardHistory implements HistoryElement<'playCard'> {
  type = 'playCard' as const;
  data: THistoryData['playCard'];
  stage: THistoryStage;
  canBeHidden: boolean = true;

  constructor(options: { cardName: TPlotCardNames; owner: IPlayerInGame }) {
    this.data = {
      owner: options.owner,
      cardName: options.cardName,
    };

    this.stage = 'finished';
  }

  dataForManager() {
    return {
      type: <const>'playCard',
      cardName: this.data.cardName,
      ownerID: this.data.owner.userID,
    };
  }
}
