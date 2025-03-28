import type { IPlayerInGame } from '@/core/game';

import type { HistoryElement, THistoryData, TDataForManagerOptions } from '@/core/game/history';

import type { TVoteOption, THistoryStage, THistoryVote } from '@avalon/types';

export * from '@/core/game/history/vote/interface';

export class Vote implements HistoryElement<'vote'> {
  type = 'vote' as const;
  data: THistoryData['vote'];
  stage: THistoryStage;
  canBeHidden: boolean = true;

  constructor(players: IPlayerInGame[], leader: IPlayerInGame, index: number, forced?: true) {
    this.stage = 'active';

    const votes = players.map((player) => {
      return {
        player,
        onMission: Boolean(player.features.isSent),
        value: <TVoteOption>(forced ? 'approve' : 'unvoted'),
      };
    });

    this.data = {
      leader,
      index,
      forced: Boolean(forced),
      team: players.filter((player) => player.features.isSent).map((el) => ({ id: el.user.id })),
      votes,
    };

    if (forced) {
      this.stage = 'finished';
      this.data.result = 'approve';
    }
  }

  /**
   * Make vote by player
   *
   * @returns true if vote is completed
   */
  makeVote(player: IPlayerInGame, option: TVoteOption): boolean {
    const vote = this.data.votes.find((el) => el.player === player);

    if (vote === undefined) {
      throw new Error(`Player cant vote in this game`);
    }

    if (vote.value !== 'unvoted') {
      throw new Error(`Player already make voted`);
    }

    player.features.waitForAction = false;
    vote.value = option;

    if (this.data.votes.every((vote) => vote.value !== 'unvoted')) {
      const approveVotes = this.data.votes.filter((el) => el.value === 'approve');
      const rejectVotes = this.data.votes.filter((el) => el.value === 'reject');

      this.data.result = approveVotes.length > rejectVotes.length ? 'approve' : 'reject';
      this.stage = 'finished';

      return true;
    }

    return false;
  }

  getUnvotedPlayers(): IPlayerInGame[] {
    return this.data.votes.filter((el) => !el.preVote).map((el) => el.player);
  }

  dataForManager(options: TDataForManagerOptions) {
    const data = <THistoryVote>{
      type: this.type,
      result: this.data.result!,
      index: this.data.index,
      forced: this.data.forced,
      leaderID: this.data.leader.user.id,
      team: this.data.team,
    };

    if (options.game.stage !== 'end' && options.game.features.anonymousVoting === true) {
      data.anonymous = true;

      data.votes = this.data.votes.reduce(
        (acc, el) => {
          acc[<TVoteOption>el.value] += 1;
          return acc;
        },
        { approve: 0, reject: 0 },
      );
    } else {
      data.anonymous = false;
      data.votes = this.data.votes.map((el) => ({
        playerID: el.player.user.id,
        onMission: el.onMission,
        excalibur: el.excalibur,
        preVote: el.preVote,
        value: <TVoteOption>el.value,
      }));
    }

    return data;
  }
}
