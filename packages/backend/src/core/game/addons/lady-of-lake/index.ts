import { IGameAddon } from '@/core/game/addons/interface';
import { Game, IPlayerInGame } from '@/core/game';
import { TLoyalty, TRoles } from '@avalon/types';
import { Subject, of } from 'rxjs';
import { CheckLoyaltyAbstractAddon } from '@/core/game/addons/check-loyalty';

export class LadyOfLakeAddon extends CheckLoyaltyAbstractAddon implements IGameAddon {
  addonName: 'ladyOfLake' | 'ladyOfSea' = 'ladyOfLake';
  featureName: 'ladyOfLake' | 'ladyOfSea' = 'ladyOfLake';
  featureValue: CheckLoyaltyAbstractAddon['featureValue'] = 'has';
  checkLoyaltySubject: Subject<boolean> = new Subject();
  game: Game;

  constructor(game: Game) {
    super(game);
    this.game = game;
  }

  afterInit() {
    // On check loyalty user with lady of lake can select players
    this.game.selectAvailable.checkLoyalty = (player) => player.features[this.addonName] === 'has';

    let lastPlayer = this.game.leader;
    while (lastPlayer.next !== this.game.leader) {
      lastPlayer = lastPlayer.next;
    }

    // Right player from leader get ladyOfLake
    lastPlayer.features[this.addonName] = 'has';

    return of(true);
  }

  beforeSelectTeam() {
    if (this.game.turn === 0 && this.game.round >= 2) {
      this.game.players.forEach((player) => {
        player.features.waitForAction = player.features[this.addonName] === 'has';
      });

      this.game.stage = 'checkLoyalty';
      this.game.stateObserver.gameStateChanged();
      return this.checkLoyaltySubject.asObservable();
    }

    return of(true);
  }

  protected calculateLoyalty(selectedPlayer: IPlayerInGame): TLoyalty | TRoles {
    return selectedPlayer.role.visibleLoylaty;
  }

  postAnnounceAction(ownerOfCheck: IPlayerInGame, selectedPlayer: IPlayerInGame): void {
    ownerOfCheck.features[this.featureName] = 'used';
    ownerOfCheck.features.waitForAction = false;
    selectedPlayer.features[this.featureName] = 'has';
    selectedPlayer.features.isSelected = false;

    this.game.leader.features.waitForAction = true;

    this.game.stage = 'selectTeam';

    this.game.stateObserver.gameStateChanged();

    this.checkLoyaltySubject.next(false);
  }
}
