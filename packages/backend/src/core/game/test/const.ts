import * as _ from 'lodash';
import { GameTestHelper } from '@/core/game/test/helpers';
import { IGameOptions } from '@avalon/types';
import { gamesSettings } from '@/core/game';

export const options = [7, { roles: { merlin: 1 }, addons: {} }] as [number, IGameOptions];
export const settings = gamesSettings[options[0]];
const gameHelper = new GameTestHelper(...options);
let game = gameHelper.game;

export function generateNewGame(addons?: IGameOptions['addons']) {
  const clone = _.cloneDeep(options);

  if (addons) {
    clone[1].addons = _.merge(clone[1].addons, addons);
  }

  gameHelper.restartGame(...clone);
  game = gameHelper.game;
  return { game, gameHelper };
}
