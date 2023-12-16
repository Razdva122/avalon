import type { IPlayerInGame } from '@/game';

import type { IMissionSettings, TMissionResult, THistoryStage } from '@avalon/types';

import type { HistoryElement, THistoryData } from '@/game/history';

export * from '@/game/history/mission/interface';

export class Mission implements HistoryElement<'mission'> {
  type = 'mission' as const;
  data: THistoryData['mission'];
  stage: THistoryStage;

  constructor(stage: 'active' | 'inactive', settings: IMissionSettings) {
    this.stage = stage;
    this.data = {
      settings,
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

    action.value = result;

    if (this.data.actions.every((action) => action.value !== 'unvoted')) {
      this.stage = 'finished';
      const fails = this.data.actions.filter((action) => action.value === 'fail').length;

      this.data.result = fails >= this.data.settings.failsRequired ? 'fail' : 'success';
      this.data.fails = fails;

      return true;
    }

    return false;
  }
}
