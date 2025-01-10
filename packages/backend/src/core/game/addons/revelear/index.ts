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
    if (this.game.round === 0) {
      const clericId = this.game.players.find((player) => player.role.role === 'cleric')!.user.id;
      const leader = this.game.leader;
      this.game.updateVisibleRolesState(clericId, { [leader.user.id]: leader.role.visibleLoylaty });
    }

    return of(true);
  }
}
