import type { HistoryElement, THistoryData } from '@/core/game/history';
import type { THistoryStage, TMissionResult } from '@avalon/types';
import type { IPlayerInGame } from '@/core/game';
import type { TDataForManagerOptions } from '@/core/game/history';

export class SwitchResult implements HistoryElement<'switchResult'> {
  type = 'switchResult' as const;
  data: THistoryData['switchResult'];
  stage: THistoryStage;

  constructor(switcher: IPlayerInGame, target?: IPlayerInGame, result?: TMissionResult) {
    this.data = {
      switcher,
      target,
      result,
    };

    this.stage = 'finished';
  }

  dataForManager(options: TDataForManagerOptions) {
    const switcherID = this.data.switcher.user.id;
    const targetID = this.data.target?.user.id;

    const switchData = {
      type: this.type,
      result: this.data.result,
      switcherID: this.data.switcher.user.id,
      targetID: this.data.target?.user.id,
    };

    if (options.game.stage === 'end' || options.userID === targetID || options.userID === switcherID) {
      return switchData;
    }

    delete switchData['result'];

    return switchData;
  }
}
