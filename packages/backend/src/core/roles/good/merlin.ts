import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Merlin extends Character {
  role: TRoles = 'merlin';
  selfRole: TRoles = 'merlin';
  loyalty: TLoyalty = 'good';

  visibility: TVisibility = {
    servant: 'unknown',
    minion: 'evil',
    merlin: 'unknown',
    morgana: 'evil',
    oberon: 'oberon',
    mordred: 'unknown',
    percival: 'unknown',
  };
}
