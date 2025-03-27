import type { IPlayerInGame } from '@/core/game';
import type { HistoryElement, THistoryData } from '@/core/game/history';
import type { TVoteOption, THistoryStage } from '@avalon/types';

export class PreVote implements HistoryElement<'preVote'> {
  type = 'preVote' as const;
  data: THistoryData['preVote'];
  stage: THistoryStage;
  canBeHidden: boolean = true;

  constructor(players: IPlayerInGame[]) {
    this.stage = 'active';

    const votes = players.map((player) => {
      return {
        player,
        onMission: Boolean(player.features.isSent),
        value: <TVoteOption | 'unvoted'>'unvoted',
      };
    });

    this.data = {
      votes,
    };
  }

  makeVote(player: IPlayerInGame, option: TVoteOption): boolean {
    const vote = this.data.votes.find((el) => el.player === player);

    if (vote === undefined) {
      throw new Error(`Player can't vote in this pre-vote`);
    }

    if (vote.value !== 'unvoted') {
      throw new Error(`Player already made a vote`);
    }

    player.features.waitForAction = false;
    player.features.preVote = option;
    vote.value = option;

    if (this.data.votes.every((vote) => vote.value !== 'unvoted')) {
      this.stage = 'finished';

      return true;
    }

    return false;
  }

  /**
   * Convert data for frontend and database
   */
  dataForManager() {
    return {
      type: <const>'preVote',
      votes: this.data.votes.map((el) => ({
        playerID: el.player.user.id,
        value: <TVoteOption>el.value,
      })),
    };
  }
}
