import * as _ from 'lodash';

import { IGameAddon } from '@/core/game/addons/interface';
import { Assassinate } from '@/core/game/addons/assassin/assassinate';
import { Game } from '@/core/game';
import { Subject, of } from 'rxjs';

import type { TAssassinateType, TAssassinAddonData, TGameEndReasons } from '@avalon/types';

import type { TAssassinateOptions } from '@/core/game/addons/assassin/interface';

export * from '@/core/game/addons/assassin/interface';

export class AssassinAddon implements IGameAddon<TAssassinateOptions> {
  addonName = 'assassin';
  assassinateSubject: Subject<boolean> = new Subject();
  game: Game;
  options: TAssassinateOptions;

  constructor(game: Game, options: TAssassinateOptions) {
    this.game = game;
    this.options = options;
  }

  get addonData(): TAssassinAddonData {
    return {
      assassin: {
        assassinateTargets: <TAssassinateType[]>Object.keys(this.options),
      },
    };
  }

  updateOptions(options: TAssassinateOptions) {
    this.options = { ...this.options, ...options };
  }

  afterInit() {
    // On assassinate stage all minions are visible
    this.game.stageVisibilityChange.assassinate = (_stage, role) => role.loyalty === 'evil';
    // On assassinate stage assassin can select players
    this.game.selectAvailable.assassinate = (player) => Boolean(player.features.isAssassin);

    return of(true);
  }

  beforeEndGame() {
    if (this.game.calculateCurrentWinner() === 'good') {
      this.game.stage = 'assassinate';

      // Generate assassin
      const assassin = _.sample(this.game.players.filter((player) => player.role.loyalty === 'evil'))!;

      assassin.features.isAssassin = true;
      assassin.features.waitForAction = true;

      this.game.stateObserver.gameStateChanged();
      return this.assassinateSubject.asObservable();
    }

    return of(true);
  }

  /**
   * Evil team try assassinate specific roles
   */
  assassinate(executorID: string, type: TAssassinateType): void {
    if (this.game.stage !== 'assassinate') {
      throw new Error(`You cant assassinate on stage ${this.game.stage}`);
    }

    const assassin = this.game.players.find((player) => player.features.isAssassin)!;

    if (assassin.user.id !== executorID) {
      throw new Error('Only assassin can assassinate');
    }

    const options = this.options[type];

    if (!options) {
      throw new Error(`You cant assassinate ${type} in this game`);
    }

    if (this.game.selectedPlayers.length !== options.length) {
      throw new Error(
        `Invalid selected player count for ${type} assassinate. Expected: ${options.length}, Selected: ${this.game.selectedPlayers.length}`,
      );
    }

    const assassinate = new Assassinate(assassin, type, options);

    if (assassinate.assassinatePlayers(this.game.selectedPlayers) === 'hit') {
      this.game.result = {
        winner: 'evil',
        reason: <TGameEndReasons>`kill${_.capitalize(type)}`,
      };
    } else {
      this.game.result = {
        winner: 'good',
        reason: <TGameEndReasons>`miss${_.capitalize(type)}`,
      };
    }

    assassin.features.waitForAction = false;
    this.game.stage = 'end';

    this.game.history.push(assassinate);
    this.game.stateObserver.gameStateChanged();
    this.assassinateSubject.next(false);
  }
}
