import { GameTestHelper } from '@/core/game/test/helpers';
import { gamesSettings } from '@/core/game';

const options = [7, { roles: { merlin: 1 } }] as const;
export const settings = gamesSettings[options[0]];
const gameHelper = new GameTestHelper(...options);
let game = gameHelper.game;

export function generateNewGame() {
  gameHelper.restartGame(...options);
  game = gameHelper.game;
  return { game, gameHelper };
}
