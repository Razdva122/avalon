import { IGameAddon } from '@/core/game/addons/interface';
import { Game, IPlayerInGame } from '@/core/game';
import { TLoyalty, TRoles } from '@avalon/types';
import { LoyaltyChecker } from '@/core/game/addons/check-loyalty/loyalty-checker';
import { ILoyaltyActionHandler } from '@/core/game/addons/check-loyalty/interface';
import { of } from 'rxjs';

export abstract class CheckLoyaltyAbstractAddon implements IGameAddon, ILoyaltyActionHandler {
  abstract addonName: string;
  abstract featureName: 'ladyOfLake' | 'ladyOfSea' | 'witchLoyalty';
  game: Game;
  loyaltyChecker: LoyaltyChecker;

  constructor(game: Game) {
    this.game = game;
    this.loyaltyChecker = new LoyaltyChecker(game, this);
  }

  afterInit() {
    this.game.addSelectAvailableStage('checkLoyalty', (player) => player.features[this.featureName] === 'active');
    return of(true);
  }

  checkLoyalty(executorID: string) {
    const ownerOfCheck = this.game.players.find((player) => player.features[this.featureName] === 'active')!;

    if (this.game.selectedPlayers.length !== 1) {
      throw new Error('Only one player can be selected check loyalty');
    }

    const selectedPlayer = this.game.selectedPlayers[0];

    if (selectedPlayer.features[this.featureName] !== undefined) {
      throw new Error(`You can't use the ${this.featureName} on the previous owner or yourself`);
    }

    this.loyaltyChecker.checkLoyalty(executorID, ownerOfCheck, selectedPlayer);
  }

  getLoyalty(executorID: string): TLoyalty | TRoles {
    return this.loyaltyChecker.getLoyalty(executorID, this.game.selectedPlayers[0]);
  }

  announceLoyalty(executorID: string, loyalty: TLoyalty | TRoles) {
    const selectedPlayer = this.game.selectedPlayers[0];

    this.loyaltyChecker.announceLoyalty(executorID, selectedPlayer, loyalty);
  }

  abstract postAnnounceAction(ownerOfCheck: IPlayerInGame, selectedPlayer: IPlayerInGame): void;
}
