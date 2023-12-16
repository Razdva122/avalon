import type { Game } from '@/game'

export class GameTestHelper {
  game: Game

  constructor(game: Game) {
    this.game = game
  }

  selectPlayersOnMission(evil: number = 0): this {
    const amount = this.game.currentMission.data.settings.players
    const evilPlayers = this.game.players.filter((player) => player.role.loyalty === 'evil')

    for (let i = 0; i < amount; i += 1) {
      if (evil > 0) {
        evil -= 1
        this.game.selectPlayer(evilPlayers[evil].user.id)
      } else {
        const unselectedPlayer = this.game.players.find((player) => player.features.isSelected === false)!
        this.game.selectPlayer(unselectedPlayer?.user.id)
      }
    }

    return this
  }

  makeVotes(rejects: number = 0): this {
    this.game.players.forEach((player) => {
      if (rejects > 0) {
        rejects -= 1
        this.game.voteForMission(player.user.id, 'reject')
      } else {
        this.game.voteForMission(player.user.id, 'approve')
      }
    })

    return this
  }

  makeActions(fails: number = 0): this {
    this.game.currentMission.data.actions.forEach((action) => {
      if (action.player.role.loyalty === 'evil' && fails > 0) {
        this.game.actionOnMission(action.player.user.id, 'fail')
        fails -= 1
      } else {
        this.game.actionOnMission(action.player.user.id, 'success')
      }
    })

    return this
  }

  sentSelectedPlayers(): this {
    this.game.sentSelectedPlayers()
    return this
  }

  pickMerlin(correctMerlin: boolean = false): this {
    const id = this.game.players.find((player) => {
      return correctMerlin ? player.role.role === 'merlin' : player.role.role !== 'merlin'
    })!.user.id

    this.game.addons.merlin!.selectMerlin(id)

    return this
  }
}
