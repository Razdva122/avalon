import { IGameAddon } from '@/core/game/addons/interface';
import { Game, IPlayerInGame } from '@/core/game';
import { of } from 'rxjs';
import { CheckLoyaltyAbstractAddon } from '@/core/game/addons/check-loyalty';

export class LadyOfLakeAddon extends CheckLoyaltyAbstractAddon implements IGameAddon {
  addonName: 'ladyOfLake' | 'ladyOfSea' = 'ladyOfLake';
  featureName: 'ladyOfLake' | 'ladyOfSea' = 'ladyOfLake';
  game: Game;

  constructor(game: Game) {
    super(game);
    this.game = game;
  }

  afterInit() {
    const lastPlayer = this.game.players.find((player) => player.next === this.game.leader)!;

    // Right player from leader get ladyOfLake
    lastPlayer.features[this.addonName] = 'has';

    return super.afterInit();
  }

  beforeSelectTeam() {
    if (this.game.turn === 0 && this.game.round >= 2) {
      this.game.leader.features.waitForAction = false;

      this.game.players.forEach((player) => {
        if (player.features[this.addonName] === 'has') {
          player.features.waitForAction = true;
          player.features[this.addonName] = 'active';
        }
      });

      return this.loyaltyChecker.startChecking('checkLoyalty');
    }

    return of(true);
  }

  postAnnounceAction(ownerOfCheck: IPlayerInGame, selectedPlayer: IPlayerInGame): void {
    ownerOfCheck.features[this.featureName] = 'used';
    ownerOfCheck.features.waitForAction = false;
    selectedPlayer.features[this.featureName] = 'has';
    selectedPlayer.features.isSelected = false;

    this.game.leader.features.waitForAction = true;
  }
}
