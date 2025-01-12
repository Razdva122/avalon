import { IGameAddon } from '@/core/game/addons/interface';
import { of } from 'rxjs';
import { Game } from '@/core/game';

export class RevealerAddon implements IGameAddon {
  addonName = 'revealer';
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  afterEndMission() {
    const isTwoMissionFailed = this.game.missions.filter((mission) => mission.data.result === 'fail').length === 2;
    const lastMissionIsFail = this.game.missions[this.game.round - 1].data.result === 'fail';

    if (isTwoMissionFailed && lastMissionIsFail) {
      const revealerId = this.game.players.find((player) => player.role.role === 'revealer')!.user.id;
      this.game.updateVisibleRolesState('all', { [revealerId]: 'revealer' });
      this.game.stateObserver.gameStateChanged();
    }

    return of(true);
  }
}
