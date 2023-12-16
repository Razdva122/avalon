import type { IPlayerInGame } from '@/game'

import type { HistoryElement, THistoryData } from '@/game/history'

import type { TVoteOption, THistoryStage } from '@avalon/types'

export * from '@/game/history/vote/interface'

export class Vote implements HistoryElement<'vote'> {
  type = 'vote' as const
  data: THistoryData['vote']
  stage: THistoryStage

  constructor(players: IPlayerInGame[], leader: IPlayerInGame, forced?: true) {
    this.stage = 'active'

    this.data = {
      leader,
      votes: players.map((player) => ({
        player,
        onMission: player.features.isSent,
        value: forced ? 'approve' : 'unvoted',
      })),
    }

    if (forced) {
      this.stage = 'finished'
      this.data.result = 'approve'
    }
  }

  /**
   * Make vote by player
   *
   * @returns true if vote is completed
   */
  makeVote(player: IPlayerInGame, option: TVoteOption): boolean {
    const vote = this.data.votes.find((el) => el.player === player)

    if (vote === undefined) {
      throw new Error(`Player cant vote in this game`)
    }

    if (vote.value !== 'unvoted') {
      throw new Error(`Player already make voted`)
    }

    vote.value = option

    if (this.data.votes.every((vote) => vote.value !== 'unvoted')) {
      const approveVotes = this.data.votes.filter((el) => el.value === 'approve')
      const rejectVotes = this.data.votes.filter((el) => el.value === 'reject')

      this.data.result = approveVotes.length > rejectVotes.length ? 'approve' : 'reject'
      this.stage = 'finished'

      return true
    }

    return false
  }
}
