import * as _ from 'lodash';

import { IGameAddon } from '@/core/game/addons/interface';
import { Assassinate } from '@/core/game/addons/merlin/assassinate';
import { Game } from '@/core/game';
import { TGameStage } from '@avalon/types';

export class MerlinAddon implements IGameAddon {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  afterInitialization() {
    // On select merlin stage all minions are visible
    this.game.stageVisibilityChange.selectMerlin = (_stage, role) => role.loyalty === 'evil';
    // On select merlin stage assassin can select players
    this.game.selectAvailable.selectMerlin = (player) => Boolean(player.features.isAssassin);

    return true;
  }

  beforeEnd(prevStage: TGameStage) {
    if (prevStage === 'selectMerlin') {
      return true;
    }

    if (this.game.winner === 'good') {
      this.game.winner = undefined;
      this.game.updateStage('selectMerlin');

      // Generate assassin
      const assassin = _.sample(this.game.players.filter((player) => player.role.loyalty === 'evil'))!;

      assassin.features.isAssassin = true;
      assassin.features.waitForAction = true;

      this.game.stateObserver.gameStateChanged();
      return false;
    }

    return true;
  }

  /**
   * If merlin exist in game enemy can kill him in end of game
   */
  selectMerlin(executorID: string): void {
    const assassin = this.game.players.find((player) => player.features.isAssassin)!;

    if (assassin.user.id !== executorID) {
      throw new Error('Only assassin can execute merlin');
    }

    if (this.game.selectedPlayers.length !== 1) {
      throw new Error('Only one player can be selected to execute Merlin');
    }

    const selectedPlayer = this.game.selectedPlayers[0];

    const assassinate = new Assassinate(assassin);
    assassin.features.waitForAction = false;

    this.game.updateStage('end');

    if (assassinate.assassinatePlayer(selectedPlayer) === 'hit') {
      this.game.winner = 'evil';
    } else {
      this.game.winner = 'good';
    }

    this.game.history.push(assassinate);
    this.game.stateObserver.gameStateChanged();
  }
}
