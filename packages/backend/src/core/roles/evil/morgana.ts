import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Morgana extends Character {
  role: TRoles = 'morgana';
  selfRole: TRoles = 'morgana';
  loyalty: TLoyalty = 'evil';

  visibility: TVisibility = {
    servant: 'unknown',
    minion: 'evil',
    merlin: 'unknown',
    morgana: 'evil',
    oberon: 'unknown',
    mordred: 'mordred',
    percival: 'unknown',
  };
}
