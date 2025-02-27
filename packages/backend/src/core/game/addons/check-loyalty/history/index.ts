import type { HistoryElement, THistoryData } from '@/core/game/history';
import type { THistoryStage, TLoyalty, CheckLoyalty, TRoles } from '@avalon/types';
import type { IPlayerInGame } from '@/core/game';
import type { TDataForManagerOptions } from '@/core/game/history';

export class CheckLoyaltyHistory implements HistoryElement<'checkLoyalty'> {
  type = 'checkLoyalty' as const;
  data: THistoryData['checkLoyalty'];
  stage: THistoryStage;
  canBeHidden: boolean = true;

  constructor(
    validator: IPlayerInGame,
    inspected: IPlayerInGame,
    result: TLoyalty | TRoles,
    visibleLoyalty: TLoyalty | TRoles,
  ) {
    this.data = {
      validator,
      inspected,
      result,
      visibleLoyalty,
    };

    this.stage = 'finished';
  }

  dataForManager(options: TDataForManagerOptions) {
    const validatorID = this.data.validator.user.id;
    const inspectedID = this.data.inspected.user.id;

    const checkLoyaltyData: CheckLoyalty = {
      type: this.type,
      result: this.data.result,
      visibleLoyalty: this.data.visibleLoyalty,
      validatorID: validatorID,
      inspectedID: inspectedID,
    };

    if (options.game.stage === 'end' || options.userID === validatorID || options.userID === inspectedID) {
      return checkLoyaltyData;
    }

    delete checkLoyaltyData['visibleLoyalty'];

    return checkLoyaltyData;
  }
}
