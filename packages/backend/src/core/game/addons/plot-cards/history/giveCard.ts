import type { HistoryElement, THistoryData } from '@/core/game/history';
import type { THistoryStage, TPlotCardNames } from '@avalon/types';
import type { IPlayerInGame } from '@/core/game';

export class GiveCardHistory implements HistoryElement<'giveCard'> {
  type = 'giveCard' as const;
  data: THistoryData['giveCard'];
  stage: THistoryStage;
  canBeHidden: boolean = true;

  constructor(
    options:
      | { leader: IPlayerInGame; target: 'self'; cardName: TPlotCardNames }
      | { leader: IPlayerInGame; target: 'player'; cardName: TPlotCardNames; owner: IPlayerInGame },
  ) {
    if (options.target === 'self') {
      this.data = {
        leader: options.leader,
        target: options.target,
        owner: options.leader,
        cardName: options.cardName,
      };
    } else {
      this.data = {
        leader: options.leader,
        target: options.target,
        owner: options.owner,
        cardName: options.cardName,
      };
    }

    this.stage = 'finished';
  }

  dataForManager() {
    return {
      type: <const>'giveCard',
      cardName: this.data.cardName,
      leaderID: this.data.leader.user.id,
      ownerID: this.data.owner.user.id,
      target: this.data.target,
    };
  }
}
