import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Witch extends Character {
  role: TRoles = 'witch';
  selfRole: TRoles = 'witch';
  loyalty: TLoyalty = 'evil';

  visibility: TVisibility = {
    minion: 'evil',
    morgana: 'evil',
    mordred: 'evil',
    lunatic: 'evil',
    trickster: 'evil',
    brute: 'evil',
    evilLancelot: 'evilLancelot',
  };
}
