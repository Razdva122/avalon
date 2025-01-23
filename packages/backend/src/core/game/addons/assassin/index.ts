import * as _ from 'lodash';

import { IGameAddon } from '@/core/game/addons/interface';
import { Assassinate } from '@/core/game/addons/assassin/assassinate';
import { Game, IPlayerInGame } from '@/core/game';
import { Subject, of } from 'rxjs';

import type {
  TAssassinateType,
  TAssassinAddonData,
  TGameEndReasons,
  Dictionary,
  TVisibleRole,
  TAssassinateProgressData,
  TRoles,
  TGoodRoles,
} from '@avalon/types';

import { goodRolesImportance } from '@avalon/types';

import type { TAssassinateOptions, TAssassinateValidator } from '@/core/game/addons/assassin/interface';

export * from '@/core/game/addons/assassin/interface';

export class AssassinAddon implements IGameAddon<TAssassinateOptions> {
  addonName = 'assassin';
  assassinateSubject: Subject<boolean> = new Subject();
  game: Game;
  options: TAssassinateOptions;
  progressData?: TAssassinateProgressData;

  constructor(game: Game, options: TAssassinateOptions) {
    this.game = game;
    this.options = options;
  }

  get addonData(): TAssassinAddonData {
    return {
      assassin: {
        assassinateTargets: <TAssassinateType[]>Object.keys(this.options),
        progressData: this.progressData,
      },
    };
  }

  updateOptions(options: TAssassinateOptions) {
    this.options = { ...this.options, ...options };
  }

  afterInit() {
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

      const visibleEvil = this.game.players
        .filter((player) => player.role.loyalty === 'evil')
        .reduce<Dictionary<TVisibleRole>>((acc, el) => {
          acc[el.user.id] = el.role.role;
          return acc;
        }, {});

      this.game.updateVisibleRolesState('all', visibleEvil);

      this.game.stateObserver.gameStateChanged();
      return this.assassinateSubject.asObservable();
    }

    return of(true);
  }

  /**
   * Evil team try assassinate specific roles
   */
  assassinate(executorID: string, type: TAssassinateType, customRole?: TRoles): void {
    if (this.game.stage !== 'assassinate') {
      throw new Error(`You cant assassinate on stage ${this.game.stage}`);
    }

    const stage = this.progressData?.stage || 0;
    const assassin = this.game.players.find((player) => player.features.isAssassin)!;

    if (assassin.user.id !== executorID) {
      throw new Error('Only assassin can assassinate');
    }

    const options = this.options[type];

    if (!options) {
      throw new Error(`You cant assassinate ${type} in this game`);
    }

    const optionsForStage = options[stage];

    if (!optionsForStage) {
      throw new Error(`You cant assassinate ${type}, with stage ${stage} in this game`);
    }

    if (Array.isArray(optionsForStage)) {
      if (this.game.selectedPlayers.length !== optionsForStage.length) {
        throw new Error(
          `Invalid selected player count for ${type} assassinate. Expected: ${options.length}, Selected: ${this.game.selectedPlayers.length}`,
        );
      }

      this.assassinateExecutor(assassin, type, stage, optionsForStage);
    } else {
      if (!customRole) {
        throw new Error('You cant assassinate without select role');
      }

      if (!this.progressData) {
        throw new Error('You cant assassinate, progress data is missing');
      }

      if (this.game.selectedPlayers.length !== 1) {
        throw new Error(
          `Invalid selected player count for ${type} assassinate. Expected: 1, Selected: ${this.game.selectedPlayers.length}`,
        );
      }

      if (this.progressData.possibleTargets?.includes(customRole)) {
        this.assassinateExecutor(assassin, type, stage, [(player: IPlayerInGame) => player.role.role === customRole]);
      } else {
        throw new Error(
          `You cant assassinate ${customRole}, valid roles ${this.progressData.possibleTargets?.join(', ')}`,
        );
      }
    }
  }

  assassinateExecutor(
    assassin: IPlayerInGame,
    type: TAssassinateType,
    stage: number,
    validator: TAssassinateValidator,
  ): void {
    const assassinate = new Assassinate(assassin, type, validator);
    const isLastStage = this.options[type]!.length === stage + 1;
    const assassinateResult = assassinate.assassinatePlayers(this.game.selectedPlayers);

    if (assassinateResult === 'hit') {
      if (isLastStage) {
        this.game.result = {
          winner: 'evil',
          reason: <TGameEndReasons>`kill${_.capitalize(type)}`,
        };
      } else {
        this.game.clearSelectedPlayers();

        const player = this.game.players.find((player) => player.role.role === type);

        if (player) {
          this.game.updateVisibleRolesState('all', { [player.user.id]: player.role.role });
        }

        this.progressData = {
          type,
          stage: stage + 1,
          possibleTargets: this.calculateValidRolesForCustom(type, stage + 1),
        };
      }
    } else {
      this.game.result = {
        winner: 'good',
        reason: <TGameEndReasons>`miss${_.capitalize(type)}`,
      };
    }

    this.game.history.push(assassinate);
    this.game.stateObserver.gameStateChanged();

    if (isLastStage || assassinateResult === 'miss') {
      assassin.features.waitForAction = false;
      this.assassinateSubject.next(true);
    }
  }

  calculateValidRolesForCustom(type: TAssassinateType, stage: number): TRoles[] | undefined {
    const option = this.options[type]?.[stage]!;

    if ('type' in option && option.type === 'custom') {
      return this.game.players
        .reduce<TRoles[]>((acc, el) => {
          if (el.role.loyalty === 'good' && option.creator(el.role.role) && !acc.includes(el.role.role)) {
            acc.push(el.role.role);
          }

          return acc;
        }, [])
        .sort((a, b) => goodRolesImportance[<TGoodRoles>a] - goodRolesImportance[<TGoodRoles>b]);
    }
  }
}
