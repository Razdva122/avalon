import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Minion extends Character {
  role: TRoles = 'minion';
  selfRole: TRoles = 'minion';
  loyalty: TLoyalty = 'evil';

  visibility: TVisibility = {
    minion: 'evil',
    morgana: 'evil',
    mordred: 'evil',
    lunatic: 'evil',
    trickster: 'evil',
    brute: 'evil',
    witch: 'evil',
    evilLancelot: 'evilLancelot',
  };
}
