import { IGameAddon } from '@/core/game/addons/interface';
import { CheckLoyaltyHistory } from '@/core/game/addons/check-loyalty/history';
import { Game, IPlayerInGame } from '@/core/game';
import { Dictionary, TLoyalty, TRoles, TVisibleRole, TGameStage } from '@avalon/types';

export abstract class CheckLoyaltyAbstractAddon implements IGameAddon {
  abstract addonName: string;
  abstract featureName: 'ladyOfLake' | 'ladyOfSea' | 'witchLoyalty';
  abstract featureValue: true | 'has';

  stageToCheck: TGameStage = 'checkLoyalty';

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  checkLoyalty(executorID: string) {
    if (this.game.stage !== this.stageToCheck) {
      throw new Error(`You cant check loyalty on stage ${this.game.stage}`);
    }

    const ownerOfCheck = this.game.players.find((player) => player.features[this.featureName] === this.featureValue)!;

    if (ownerOfCheck.user.id !== executorID) {
      throw new Error(`Only owner of ${this.featureName} can check loyalty`);
    }

    if (this.game.selectedPlayers.length !== 1) {
      throw new Error('Only one player can be selected check loyalty');
    }

    const selectedPlayer = this.game.selectedPlayers[0];

    if (selectedPlayer.features[this.featureName] !== undefined) {
      throw new Error(`You can't use the ${this.featureName} on the previous owner or yourself`);
    }

    this.game.stage = 'announceLoyalty';

    this.game.stateObserver.gameStateChanged();
  }

  getLoyalty(executorID: string): TLoyalty | TRoles {
    if (this.game.stage !== 'announceLoyalty') {
      throw new Error(`You cant get loyalty on stage ${this.game.stage}`);
    }

    const ownerOfCheck = this.game.players.find((player) => player.features[this.featureName] === this.featureValue)!;

    if (ownerOfCheck.user.id !== executorID) {
      throw new Error(`Only owner of ${this.featureName} can check loyalty`);
    }

    return this.calculateLoyalty(this.game.selectedPlayers[0]);
  }

  protected calculateLoyalty(selectedPlayer: IPlayerInGame): TLoyalty | TRoles {
    return selectedPlayer.role.visibleLoylaty;
  }

  announceLoyalty(executorID: string, loyalty: TLoyalty | TRoles) {
    if (this.game.stage !== 'announceLoyalty') {
      throw new Error(`You cant announce loyalty on stage ${this.game.stage}`);
    }

    const ownerOfCheck = this.game.players.find((player) => player.features[this.featureName] === this.featureValue)!;

    if (ownerOfCheck.user.id !== executorID) {
      throw new Error(`Only owner of ${this.featureName} can announce loyalty`);
    }

    const selectedPlayer = this.game.selectedPlayers[0];

    const loyaltyCheck = new CheckLoyaltyHistory(ownerOfCheck, selectedPlayer, loyalty, this.getLoyalty(executorID));

    this.game.history.push(loyaltyCheck);

    this.updateVisibleRoles(ownerOfCheck, selectedPlayer);

    this.postAnnounceAction(ownerOfCheck, selectedPlayer);
  }

  abstract postAnnounceAction(ownerOfCheck: IPlayerInGame, selectedPlayer: IPlayerInGame): void;

  updateVisibleRoles(owner: IPlayerInGame, selectedPlayer: IPlayerInGame): void {
    const ownerRole = owner.role.role;
    const selectedPlayerRole = selectedPlayer.role.role;

    if (ownerRole === 'percival') {
      if (selectedPlayerRole.startsWith('merlin') || selectedPlayerRole === 'morgana') {
        const merlin = this.game.players.find((player) => player.role.role.startsWith('merlin'));
        const morgana = this.game.players.find((player) => player.role.role === 'morgana');

        const roles: Dictionary<TVisibleRole> = {};

        if (merlin) {
          roles[merlin.user.id] = merlin.role.role;
        }

        if (morgana) {
          roles[morgana.user.id] = morgana.role.role;
        }

        this.game.updateVisibleRolesState(owner.user.id, roles);
      }
    }

    if (ownerRole === 'guinevere') {
      if (selectedPlayerRole === 'evilLancelot' || selectedPlayerRole === 'goodLancelot') {
        const goodLancelot = this.game.players.find((player) => player.role.role === 'goodLancelot')!;
        const evilLancelot = this.game.players.find((player) => player.role.role === 'evilLancelot')!;

        this.game.updateVisibleRolesState(owner.user.id, {
          [goodLancelot.user.id]: 'goodLancelot',
          [evilLancelot.user.id]: 'evilLancelot',
        });
      }
    }
  }
}
