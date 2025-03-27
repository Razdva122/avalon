import type { HistoryElement, THistoryData } from '@/core/game/history';
import type { THistoryStage } from '@avalon/types';
import type { IPlayerInGame } from '@/core/game';

export class LeadToVictoryHistory implements HistoryElement<'leadToVictory'> {
  type = 'leadToVictory' as const;
  data: THistoryData['leadToVictory'];
  stage: THistoryStage;
  canBeHidden: boolean = true;

  constructor(owner: IPlayerInGame, prevLeader: IPlayerInGame) {
    this.data = {
      owner,
      prevLeader,
    };

    this.stage = 'finished';
  }

  dataForManager() {
    return {
      type: <const>'leadToVictory',
      prevLeaderID: this.data.prevLeader.user.id,
      ownerID: this.data.owner.user.id,
    };
  }
}
