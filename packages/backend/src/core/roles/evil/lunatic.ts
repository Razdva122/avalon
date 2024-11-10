import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles, TMissionResult } from '@avalon/types';

export class Lunatic extends Character {
  role: TRoles = 'lunatic';
  selfRole: TRoles = 'lunatic';
  loyalty: TLoyalty = 'evil';

  visibility: TVisibility = {
    minion: 'evil',
    morgana: 'evil',
    mordred: 'evil',
    trickster: 'evil',
    brute: 'evil',
    witch: 'evil',
    evilLancelot: 'evilLancelot',
  };

  override get validMissionResult(): TMissionResult[] {
    return ['fail'];
  }
}
