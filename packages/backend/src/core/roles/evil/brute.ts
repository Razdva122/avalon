import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles, TMissionResult } from '@avalon/types';

export class Brute extends Character {
  role: TRoles = 'brute';
  selfRole: TRoles = 'brute';
  loyalty: TLoyalty = 'evil';

  visibility: TVisibility = {
    minion: 'evil',
    morgana: 'evil',
    mordred: 'evil',
    trickster: 'evil',
    lunatic: 'evil',
    witch: 'evil',
    evilLancelot: 'evilLancelot',
  };

  override get validMissionResult(): TMissionResult[] {
    if (this.game.round >= 3) {
      return ['success'];
    }

    return ['fail', 'success'];
  }
}
