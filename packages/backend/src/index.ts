import { Game } from '@/game'
import { User } from '@/user'

const game = new Game(
  [
    new User('misha', 'misha'),
    new User('misha2', 'misha2'),
    new User('misha3', 'misha3'),
    new User('misha4', 'misha4'),
    new User('misha5', 'misha5'),
    new User('misha6', 'misha6'),
    new User('misha7', 'misha7'),
  ],
  { roles: { merlin: 1 } },
)

console.log(game.players)
