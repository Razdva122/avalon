import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Oberon extends Character {
  role: TRoles = 'oberon';
  selfRole: TRoles = 'oberon';
  loyalty: TLoyalty = 'evil';

  visibility: TVisibility = {
    servant: 'unknown',
    minion: 'unknown',
    merlin: 'unknown',
    morgana: 'unknown',
    oberon: 'evil',
    mordred: 'unknown',
    percival: 'unknown',
  };
}
