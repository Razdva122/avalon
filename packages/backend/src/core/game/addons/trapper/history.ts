import type { IPlayerInGame } from '@/core/game';
import type { HistoryElement, TDataForManagerOptions, THistoryData } from '@/core/game/history';
import type { TMissionResult } from '@avalon/types';

export class DiscardMissionCardHistory implements HistoryElement<'discardMissionCard'> {
  type = 'discardMissionCard' as const;
  stage = 'finished' as const;
  canBeHidden = true;
  data: THistoryData['discardMissionCard'];

  constructor(leader: IPlayerInGame, target: IPlayerInGame, result: TMissionResult) {
    this.data = { leader, target, result };
  }

  dataForManager({ game, userID }: TDataForManagerOptions) {
    return {
      type: this.type,
      leaderID: this.data.leader.userID,
      targetID: this.data.target.userID,
      ...(game.stage === 'end' || userID === this.data.leader.userID ? { result: this.data.result } : {}),
    };
  }
}
