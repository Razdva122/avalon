import type { HistoryElement, THistoryData } from '@/core/game/history';
import type { THistoryStage, TPlotCardNames } from '@avalon/types';
import type { IPlayerInGame } from '@/core/game';

export class RestoreHonorHistory implements HistoryElement<'restoreHonor'> {
  type = 'restoreHonor' as const;
  data: THistoryData['restoreHonor'];
  stage: THistoryStage;
  canBeHidden: boolean = true;

  constructor(prevOwner: IPlayerInGame, newOwner: IPlayerInGame, cardName: TPlotCardNames) {
    this.data = {
      prevOwner,
      newOwner,
      cardName,
    };

    this.stage = 'finished';
  }

  dataForManager() {
    return {
      type: <const>'restoreHonor',
      prevOwnerID: this.data.prevOwner.user.id,
      newOwnerID: this.data.newOwner.user.id,
      cardName: this.data.cardName,
    };
  }
}
