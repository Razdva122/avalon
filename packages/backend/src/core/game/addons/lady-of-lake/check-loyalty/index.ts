import type { HistoryElement, THistoryData } from '@/core/game/history';
import type { THistoryStage, TLoyalty, ICheckLoyalty } from '@avalon/types';
import type { IPlayerInGame } from '@/core/game';
import type { TDataForManagerOptions } from '@/core/game/history';

export class CheckLoyalty implements HistoryElement<'checkLoyalty'> {
  type = 'checkLoyalty' as const;
  data: THistoryData['checkLoyalty'];
  stage: THistoryStage;

  constructor(validator: IPlayerInGame, inspected: IPlayerInGame, result: TLoyalty, realLoyalty: TLoyalty) {
    this.data = {
      validator,
      inspected,
      result,
      realLoyalty,
    };

    this.stage = 'finished';
  }

  dataForManager(options: TDataForManagerOptions) {
    const validatorID = this.data.validator.user.id;
    const inspectedID = this.data.inspected.user.id;

    const checkLoyaltyData: ICheckLoyalty = {
      type: this.type,
      result: this.data.result,
      realLoyalty: this.data.realLoyalty,
      validatorID: validatorID,
      inspectedID: inspectedID,
    };

    if (options.game.stage === 'end' || options.userID === validatorID || options.userID === inspectedID) {
      return checkLoyaltyData;
    }

    delete checkLoyaltyData['realLoyalty'];

    return checkLoyaltyData;
  }
}
