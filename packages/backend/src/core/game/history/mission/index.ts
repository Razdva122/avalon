import * as _ from 'lodash';

import type { IPlayerInGame } from '@/core/game';

import type { IMissionSettings, TMissionResult, THistoryStage, THistoryMission } from '@avalon/types';

import type { HistoryElement, THistoryData, TDataForManagerOptions } from '@/core/game/history';

export * from '@/core/game/history/mission/interface';

export class Mission implements HistoryElement<'mission'> {
  type = 'mission' as const;
  data: THistoryData['mission'];
  stage: THistoryStage;
  canBeHidden: boolean = false;

  constructor(stage: 'active' | 'inactive', settings: IMissionSettings, index: number) {
    this.stage = stage;
    this.data = {
      settings,
      index,
      actions: [],
    };
  }

  activateMission() {
    if (this.stage !== 'inactive') {
      throw new Error(`Cant activate mission with stage ${this.stage}`);
    }

    this.stage = 'active';
  }

  startMission(players: IPlayerInGame[], leader: IPlayerInGame) {
    if (this.stage !== 'active') {
      throw new Error(`Cant start mission with stage ${this.stage}`);
    }

    if (players.length !== this.data.settings.players) {
      throw new Error(`Mission required ${this.data.settings.players} but only ${players.length} provided`);
    }

    this.data.leader = leader;

    this.data.actions = players.map((player) => ({
      player,
      value: 'unvoted',
    }));

    this.stage = 'progress';
  }

  /**
   * Action on mission by player
   *
   * @returns true if mission completed
   */
  makeAction(player: IPlayerInGame, result: TMissionResult): boolean {
    if (this.stage !== 'progress') {
      throw new Error(`Cant make action on mission with stage ${this.stage}`);
    }

    const action = this.data.actions.find((el) => el.player === player);

    if (action === undefined) {
      throw new Error(`Player cant make action in this mission`);
    }

    if (!action.player.role.validMissionResult.includes(result)) {
      throw new Error(`Player cant make action with this result: ${result}`);
    }

    if (action.value !== 'unvoted') {
      throw new Error(`Player already make action`);
    }

    player.features.waitForAction = false;
    action.value = result;

    if (this.data.actions.every((action) => action.value !== 'unvoted')) {
      this.finishMission();

      return true;
    }

    return false;
  }

  switchAction(player: IPlayerInGame, switchedBy: IPlayerInGame): TMissionResult {
    const action = this.data.actions.find((el) => el.player === player);

    if (action === undefined) {
      throw new Error(`Player dont make action in this mission`);
    }

    if (action.value === 'unvoted') {
      throw new Error(`You cant switch unvoted result`);
    }

    action.value = action.value === 'fail' ? 'success' : 'fail';
    action.switchedBy = switchedBy.user.id;

    return action.value;
  }

  hideMission() {
    this.data.hidden = true;
  }

  finishMission() {
    this.stage = 'finished';
    const fails = this.data.actions.filter((action) => action.value === 'fail').length;

    this.data.result = fails >= this.data.settings.failsRequired ? 'fail' : 'success';
    this.data.fails = fails;
  }

  dataForManager(options: TDataForManagerOptions) {
    const data = <THistoryMission>{
      type: this.type,
      index: this.data.index,
      result: this.data.result!,
      settings: this.data.settings,
      leaderID: this.data.leader!.user.id,
      fails: this.data.fails!,
    };

    const isLastElement = _.last(options.game.history) === this;
    const hideElement = options.game.features.hiddenHistory && !isLastElement;

    if (this.data.hidden === true) {
      data.hidden = true;
      data.fails = undefined;
      data.result = undefined;
    }

    if (!hideElement || options.game.stage === 'end') {
      data.leaderID = this.data.leader!.user.id;
      data.actions = this.data.actions.map((action) => {
        const isGameEnded = options.game.stage === 'end';
        const isUserAction = action.player.user.id === options.userID;
        const isSwitchedByPlayer = options.userID && action.switchedBy === options.userID;

        if (isGameEnded || isUserAction || isSwitchedByPlayer) {
          return {
            playerID: action.player.user.id,
            switchedBy: action.switchedBy,
            value: action.value,
          };
        }

        return { playerID: action.player.user.id, switchedBy: action.switchedBy };
      });
    }

    return data;
  }
}
