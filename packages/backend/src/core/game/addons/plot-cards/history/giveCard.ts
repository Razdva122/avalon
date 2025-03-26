import type { HistoryElement, THistoryData } from '@/core/game/history';
import type { THistoryStage } from '@avalon/types';
import type { IPlayerInGame } from '@/core/game';

export class GiveCardHistory implements HistoryElement<'giveCard'> {
  type = 'giveCard' as const;
  data: THistoryData['giveCard'];
  stage: THistoryStage;
  canBeHidden: boolean = true;

  constructor(
    options:
      | { leader: IPlayerInGame; target: 'self' }
      | { leader: IPlayerInGame; target: 'player'; owner: IPlayerInGame },
  ) {
    if (options.target === 'self') {
      this.data = {
        leader: options.leader,
        target: options.target,
        owner: options.leader,
      };
    } else {
      this.data = {
        leader: options.leader,
        target: options.target,
        owner: options.owner,
      };
    }

    this.stage = 'finished';
  }

  dataForManager() {
    return {
      type: <const>'giveCard',
      leaderID: this.data.leader.user.id,
      ownerID: this.data.owner.user.id,
      target: this.data.target,
    };
  }
}
