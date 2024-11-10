import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Mordred extends Character {
  role: TRoles = 'mordred';
  selfRole: TRoles = 'mordred';
  loyalty: TLoyalty = 'evil';

  visibility: TVisibility = {
    minion: 'evil',
    morgana: 'evil',
    trickster: 'evil',
    lunatic: 'evil',
    brute: 'evil',
    witch: 'evil',
    evilLancelot: 'evilLancelot',
  };
}
