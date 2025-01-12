import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles, TMissionResult } from '@avalon/types';

export class Revealer extends Character {
  role: TRoles = 'revealer';
  selfRole: TRoles = 'revealer';
  loyalty: TLoyalty = 'evil';

  visibility: TVisibility = {
    minion: 'evil',
    morgana: 'evil',
    mordred: 'evil',
    trickster: 'evil',
    lunatic: 'evil',
    witch: 'evil',
    evilLancelot: 'evilLancelot',
    brute: 'evil',
  };
}
