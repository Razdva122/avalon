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
    // Generate assassin
    _.sample(this.game.players.filter((player) => player.role.loyalty === 'evil'))!.features.isAssassin = true;
    // On select merlin stage all minions are visible
    this.game.stageVisibilityChange.selectMerlin = (_stage, role) => role.loyalty === 'evil';

    return true;
  }

  beforeEnd(prevStage: TGameStage) {
    if (prevStage === 'selectMerlin') {
      return true;
    }

    if (this.game.winner === 'good') {
      this.game.winner = undefined;
      this.game.updateStage('selectMerlin');

      const assassin = this.game.players.find((player) => player.features.isAssassin)!;
      this.game.leader = assassin;
      assassin.features.waitForAction = true;

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
    this.game.leader.features.waitForAction = false;

    this.game.updateStage('end');

    if (assassinate.assassinatePlayer(this.game.selectedPlayers[0]) === 'hit') {
      this.game.winner = 'evil';
    } else {
      this.game.winner = 'good';
    }

    this.game.history.push(assassinate);
    this.game.stateObserver.gameStateChanged();
  }
}
