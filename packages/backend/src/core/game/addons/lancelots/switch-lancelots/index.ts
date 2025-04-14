import type { HistoryElement, THistoryData } from '@/core/game/history';
import type { THistoryStage, SwitchLancelots } from '@avalon/types';
import type { IPlayerInGame } from '@/core/game';
import type { TDataForManagerOptions } from '@/core/game/history';

export class SwitchLancelotsHistory implements HistoryElement<'switchLancelots'> {
  type = 'switchLancelots' as const;
  data: THistoryData['switchLancelots'];
  stage: THistoryStage;
  canBeHidden: boolean = true;

  constructor(
    goodLancelot: IPlayerInGame,
    evilLancelot: IPlayerInGame,
    switchPointer: number,
    switches: Array<boolean>,
  ) {
    this.data = {
      lancelotsIDs: {
        good: goodLancelot.userID,
        evil: evilLancelot.userID,
      },
      result: switches[switchPointer],
      pointer: switchPointer,
      switches,
    };

    this.stage = 'finished';
  }

  dataForManager(options: TDataForManagerOptions) {
    const switchLancelotsData: SwitchLancelots = {
      type: 'switchLancelots',
      ...this.data,
    };

    if (options.game.stage === 'end') {
      return switchLancelotsData;
    }

    switchLancelotsData.switches = switchLancelotsData.switches.map((el, index) =>
      index <= this.data.pointer ? el : null,
    );
    delete switchLancelotsData['lancelotsIDs'];

    return switchLancelotsData;
  }
}
