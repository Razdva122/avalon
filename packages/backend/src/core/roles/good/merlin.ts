import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Merlin extends Character {
  role: TRoles = 'merlin';
  selfRole: TRoles = 'merlin';
  loyalty: TLoyalty = 'good';

  visibility: TVisibility = {
    minion: 'evil',
    morgana: 'evil',
    oberon: 'evil',
    trickster: 'evil',
    evilLancelot: 'evil',
    lunatic: 'evil',
    brute: 'evil',
    witch: 'evil',
    revealer: 'evil',
  };
}
