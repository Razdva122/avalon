import type { HistoryElement, THistoryData } from '@/core/game/history';
import type { THistoryStage } from '@avalon/types';
import type { IPlayerInGame } from '@/core/game';

export class Assassinate implements HistoryElement<'assassinate'> {
  type = 'assassinate' as const;
  data: THistoryData['assassinate'];
  stage: THistoryStage;

  constructor(assassin: IPlayerInGame) {
    this.data = {
      assassin: assassin,
    };
    this.stage = 'progress';
  }

  assassinatePlayer(victim: IPlayerInGame) {
    const result = victim.role.role.startsWith('merlin') ? 'hit' : 'miss';
    this.data.result = result;
    this.data.killed = victim;

    this.stage = 'finished';

    return result;
  }

  dataForManager() {
    return {
      type: this.type,
      result: this.data.result!,
      assassinID: this.data.assassin.user.id,
      killedID: this.data.killed!.user.id,
    };
  }
}
