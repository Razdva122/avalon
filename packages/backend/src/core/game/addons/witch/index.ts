import { IGameAddon, TAddonPriority } from '@/core/game/addons/interface';
import { Subject, of } from 'rxjs';
import { Game } from '@/core/game';

export class WitchAddon implements IGameAddon {
  addonName = 'witch';
  isUsed: boolean = false;
  game: Game;
  useWitchSubject: Subject<boolean> = new Subject();

  priority: TAddonPriority = {
    beforeEndMission: 'low',
  };

  constructor(game: Game) {
    this.game = game;
  }

  beforeEndMission() {
    if (this.isUsed) {
      return of(true);
    }

    this.game.stage = 'witchAbility';
    this.game.stateObserver.gameStateChanged();

    return this.useWitchSubject.asObservable();
  }

  useWitchAbility(executorID: string, hide: boolean) {
    if (this.game.stage !== 'witchAbility') {
      throw new Error(`You cant use witch ability on stage ${this.game.stage}`);
    }

    const witch = this.game.players.find((player) => player.role.role === 'witch')!;

    if (witch.user.id !== executorID) {
      throw new Error('Only witch can use witch ability');
    }

    const mission = this.game.currentMission;

    if (hide === true) {
      this.isUsed = true;
      mission.hideMission();
    }

    this.useWitchSubject.next(true);
  }
}
