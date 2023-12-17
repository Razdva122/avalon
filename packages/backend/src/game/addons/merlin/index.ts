import * as _ from 'lodash';

import { IGameAddon } from '@/game/addons/interface';
import { Assassinate } from '@/game/addons/merlin/assassinate';
import { Game } from '@/game';

export class MerlinAddon implements IGameAddon {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  afterInitialization() {
    // Generate assassin
    _.sample(this.game.players.filter((player) => player.role.loyalty === 'evil'))!.features.isAssassin = true;

    return true;
  }

  beforeEnd() {
    if (this.game.winner === 'good') {
      this.game.winner = undefined;
      this.game.updateStage('selectMerlin');
      this.game.openRoles('evil');
      this.game.stateObserver.gameStateChanged();
      return false;
    }

    return true;
  }

  /**
   * If merlin exist in game enemy can kill him in end of game
   */
  selectMerlin(): void {
    if (this.game.selectedPlayers.length !== 1) {
      throw new Error('Only one player can be selected to execute Merlin');
    }

    const assassinate = new Assassinate(this.game.players.find((player) => player.features.isAssassin)!);

    // @ts-expect-error changing the stage directly to avoid loops
    this.game._stage = 'end';
    this.game.openRoles();

    if (assassinate.assassinatePlayer(this.game.selectedPlayers[0]) === 'hit') {
      this.game.winner = 'evil';
    } else {
      this.game.winner = 'good';
    }

    this.game.history.push(assassinate);
    this.game.stateObserver.gameStateChanged();
  }
}
