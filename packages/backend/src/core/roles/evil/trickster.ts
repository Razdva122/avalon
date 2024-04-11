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
    evilLancelot: 'evilLancelot',
  };

  override get visibleLoylaty(): TLoyalty {
    return 'good';
  }
}
