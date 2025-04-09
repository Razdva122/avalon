import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Trickster extends Character {
  role: TRoles = 'trickster';
  selfRole: TRoles = 'trickster';
  loyalty: TLoyalty = 'evil';

  visibility: TVisibility = {
    minion: 'evil',
    morgana: 'evil',
    mordred: 'evil',
    lunatic: 'evil',
    brute: 'evil',
    witch: 'evil',
    evilLancelot: 'evilLancelot',
    revealer: 'evil',
  };

  override get visibleLoyalty(): TLoyalty {
    return 'good';
  }
}
