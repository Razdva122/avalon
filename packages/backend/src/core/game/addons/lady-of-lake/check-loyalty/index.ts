import type { HistoryElement, THistoryData } from '@/core/game/history';
import type { THistoryStage, TLoyalty } from '@avalon/types';
import type { IPlayerInGame } from '@/core/game';

export class CheckLoyalty implements HistoryElement<'checkLoyalty'> {
  type = 'checkLoyalty' as const;
  data: THistoryData['checkLoyalty'];
  stage: THistoryStage;

  constructor(validator: IPlayerInGame, inspected: IPlayerInGame) {
    this.data = {
      validator,
      inspected,
    };

    this.stage = 'progress';
  }

  announceLoyalty(loyalty: TLoyalty) {
    this.data.result = loyalty;
    this.stage = 'finished';
  }

  dataForManager() {
    return {
      type: this.type,
      result: this.data.result,
      validatorID: this.data.validator.user.id,
      inspectedID: this.data.inspected.user.id,
    };
  }
}
