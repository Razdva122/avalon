import type { HistoryElement, THistoryData } from '@/game/history';
import type { THistoryStage } from '@avalon/types';
import type { IPlayerInGame } from '@/game';

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
    const result = victim.role.role === 'merlin' ? 'hit' : 'miss';
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
      killed: this.data.killed!.user.id,
    };
  }
}
