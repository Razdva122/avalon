import { IGameAddon } from '@/core/game/addons/interface';
import { CheckLoyalty } from '@/core/game/addons/lady-of-lake/check-loyalty';
import { Game } from '@/core/game';
import { TLoyalty } from '@avalon/types';
import { Subject, of } from 'rxjs';

export class LadyOfLakeAddon implements IGameAddon {
  addonName = 'ladyOfLake';
  checkLoyaltySubject: Subject<boolean> = new Subject();
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  afterInit() {
    // On check loyalty user with lady of lake can select players
    this.game.selectAvailable.checkLoyalty = (player) => player.features.ladyOfLake === 'has';

    let lastPlayer = this.game.leader;
    while (lastPlayer.next !== this.game.leader) {
      lastPlayer = lastPlayer.next;
    }

    // Right player from leader get ladyOfLake
    lastPlayer.features.ladyOfLake = 'has';

    return of(true);
  }

  beforeSelectTeam() {
    if (this.game.turn === 0 && this.game.round >= 2) {
      this.game.players.forEach((player) => {
        player.features.waitForAction = player.features.ladyOfLake === 'has';
      });

      this.game.stage = 'checkLoyalty';
      this.game.stateObserver.gameStateChanged();
      return this.checkLoyaltySubject.asObservable();
    }

    return of(true);
  }

  checkLoyalty(executorID: string) {
    if (this.game.stage !== 'checkLoyalty') {
      throw new Error(`You cant check loyalty on stage ${this.game.stage}`);
    }

    const ownerOfLady = this.game.players.find((player) => player.features.ladyOfLake === 'has')!;

    if (ownerOfLady.user.id !== executorID) {
      throw new Error('Only owner of lady of the lake can check loyalty');
    }

    if (this.game.selectedPlayers.length !== 1) {
      throw new Error('Only one player can be selected check loyalty');
    }

    const selectedPlayer = this.game.selectedPlayers[0];

    if (selectedPlayer.features.ladyOfLake !== undefined) {
      throw new Error("You can't use the lady of the lake on the previous owner or yourself");
    }

    this.game.stage = 'announceLoyalty';

    this.game.stateObserver.gameStateChanged();
  }

  getLoyalty(executorID: string): TLoyalty {
    if (this.game.stage !== 'announceLoyalty') {
      throw new Error(`You cant get loyalty on stage ${this.game.stage}`);
    }

    const ownerOfLady = this.game.players.find((player) => player.features.ladyOfLake === 'has')!;

    if (ownerOfLady.user.id !== executorID) {
      throw new Error('Only owner of lady of the lake can check loyalty');
    }

    const selectedPlayer = this.game.selectedPlayers[0];

    return selectedPlayer.role.visibleLoylaty;
  }

  announceLoyalty(executorID: string, loyalty: TLoyalty) {
    if (this.game.stage !== 'announceLoyalty') {
      throw new Error(`You cant announce loyalty on stage ${this.game.stage}`);
    }

    const ownerOfLady = this.game.players.find((player) => player.features.ladyOfLake === 'has')!;

    if (ownerOfLady.user.id !== executorID) {
      throw new Error('Only owner of lady of the lake can announce loyalty');
    }

    const selectedPlayer = this.game.selectedPlayers[0];

    const loyaltyCheck = new CheckLoyalty(ownerOfLady, selectedPlayer, loyalty, selectedPlayer.role.loyalty);

    this.game.history.push(loyaltyCheck);

    ownerOfLady.features.ladyOfLake = 'used';
    ownerOfLady.features.waitForAction = false;
    selectedPlayer.features.ladyOfLake = 'has';
    selectedPlayer.features.isSelected = false;

    this.game.leader.features.waitForAction = true;

    this.game.stage = 'selectTeam';

    this.game.stateObserver.gameStateChanged();

    this.checkLoyaltySubject.next(false);
  }
}
