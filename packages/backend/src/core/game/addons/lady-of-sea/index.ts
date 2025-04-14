import * as _ from 'lodash';

import { evilRolesImportance } from '@avalon/types';

import { IGameAddon } from '@/core/game/addons/interface';
import { Game, IPlayerInGame } from '@/core/game';
import { TLoyalty, TRoles, TEvilRoles, AddonsData, TVisibleRole, Dictionary } from '@avalon/types';
import { LadyOfLakeAddon } from '@/core/game/addons/lady-of-lake';

export class LadyOfSeaAddon extends LadyOfLakeAddon implements IGameAddon {
  override addonName: LadyOfLakeAddon['addonName'] = 'ladyOfSea';
  override featureName: LadyOfLakeAddon['featureName'] = 'ladyOfSea';

  loyaltyTargets: Array<TRoles | 'good'>;
  fakeEvilRole: TRoles;

  constructor(game: Game) {
    super(game);

    const validEvilRoles = _.uniq(game.settings.roles.evil)
      .filter((role) => role !== 'trickster')
      .sort((a, b) => evilRolesImportance[<TEvilRoles>a] - evilRolesImportance[<TEvilRoles>b]);

    this.loyaltyTargets = ['good', ...validEvilRoles];
    this.fakeEvilRole = _.sample(validEvilRoles)!;
  }

  get addonData(): AddonsData {
    return {
      ladyOfSea: {
        loyaltyTargets: this.loyaltyTargets,
      },
    };
  }

  calculateLoyalty(selectedPlayer: IPlayerInGame): TLoyalty | TRoles {
    if (selectedPlayer.role.visibleLoyalty === 'good') {
      return 'good';
    }

    // Generate random evil role from game
    if (selectedPlayer.role.visibleLoyalty === 'evil' && selectedPlayer.role.loyalty === 'good') {
      return this.fakeEvilRole;
    }

    return selectedPlayer.role.role;
  }

  updateVisibleRoles(owner: IPlayerInGame, selectedPlayer: IPlayerInGame): void {
    const visibleRole = this.calculateLoyalty(selectedPlayer);

    if (visibleRole !== 'good') {
      const roles: Dictionary<TVisibleRole> = { [selectedPlayer.userID]: visibleRole };

      this.game.updateVisibleRolesState(owner.userID, roles);
    }
  }
}
