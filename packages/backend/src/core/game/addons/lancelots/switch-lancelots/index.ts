import type { HistoryElement, THistoryData } from '@/core/game/history';
import type { THistoryStage, ISwitchLancelots } from '@avalon/types';
import type { IPlayerInGame } from '@/core/game';
import type { TDataForManagerOptions } from '@/core/game/history';

export class SwitchLancelots implements HistoryElement<'switchLancelots'> {
  type = 'switchLancelots' as const;
  data: THistoryData['switchLancelots'];
  stage: THistoryStage;
  canBeHidden: boolean = true;

  constructor(goodLancelot: IPlayerInGame, evilLancelot: IPlayerInGame, switched: boolean) {
    this.data = {
      lancelotsIDs: {
        good: goodLancelot.user.id,
        evil: evilLancelot.user.id,
      },
      result: switched,
    };

    this.stage = 'finished';
  }

  dataForManager(options: TDataForManagerOptions) {
    const switchLancelotsData: ISwitchLancelots = {
      type: 'switchLancelots',
      ...this.data,
    };

    if (options.game.stage === 'end') {
      return switchLancelotsData;
    }

    delete switchLancelotsData['lancelotsIDs'];

    return switchLancelotsData;
  }
}
