import * as _ from 'lodash';
import { GameTestHelper } from '@/core/game/test/helpers';
import { GameOptions } from '@avalon/types';
import { gamesSettings } from '@/core/game';

export const defaultOptions = [7, { roles: {}, addons: {} }] as [number, GameOptions];
export const settings = gamesSettings[defaultOptions[0]];
const gameHelper = new GameTestHelper(...defaultOptions);
let game = gameHelper.game;

export function generateNewGame(addons?: GameOptions['addons'], roles?: GameOptions['roles'], players?: number) {
  const clone = _.cloneDeep(defaultOptions);

  if (addons) {
    clone[1].addons = _.merge(clone[1].addons, addons);
  }

  if (roles) {
    clone[1].roles = _.merge(clone[1].roles, roles);
  }

  if (players) {
    clone[0] = players;
  }

  gameHelper.restartGame(...clone);
  game = gameHelper.game;
  return { game, gameHelper };
}
