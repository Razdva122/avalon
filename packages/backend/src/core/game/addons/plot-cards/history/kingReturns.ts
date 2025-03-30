import { HistoryElement, THistoryData } from '@/core/game/history';
import { THistoryStage } from '@avalon/types';
import { IPlayerInGame } from '@/core/game/interface';

export class KingReturns implements HistoryElement<'kingReturns'> {
  type = <const>'kingReturns';
  stage: THistoryStage;
  canBeHidden = false;
  data: THistoryData['kingReturns'];

  constructor(owner: IPlayerInGame) {
    this.data = {
      owner: owner,
    };

    this.stage = 'finished';
  }

  dataForManager() {
    const ownerID = this.data.owner.user.id;

    return {
      type: this.type,
      ownerID,
    };
  }
}
