import { HistoryElement, THistoryData } from '@/core/game/history';
import { THistoryStage } from '@avalon/types';
import { IPlayerInGame } from '@/core/game/interface';
import { TMissionResult } from '@avalon/types';
import type { TDataForManagerOptions } from '@/core/game/history';

export class Ambush implements HistoryElement<'ambush'> {
  type = <const>'ambush';
  stage: THistoryStage;
  canBeHidden = false;
  data: THistoryData['ambush'];

  constructor(owner: IPlayerInGame, target: IPlayerInGame, action: TMissionResult) {
    this.data = {
      owner: owner,
      target: target,
      result: action,
    };

    this.stage = 'finished';
  }

  dataForManager(options: TDataForManagerOptions) {
    const ownerID = this.data.owner.userID;
    const targetID = this.data.target.userID;

    const ambushData = {
      type: this.type,
      ownerID,
      targetID,
      result: this.data.result,
    };

    if (options.game.stage === 'end' || options.userID === targetID || options.userID === ownerID) {
      return ambushData;
    }

    delete ambushData['result'];

    return ambushData;
  }
}
