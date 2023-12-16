import { Character } from '@/roles/abstract';
import type { TVisibility } from '@/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Mordred extends Character {
  role: TRoles = 'mordred';
  selfRole: TRoles = 'mordred';
  loyalty: TLoyalty = 'evil';

  visibility: TVisibility = {
    servant: 'unknown',
    minion: 'evil',
    merlin: 'unknown',
    morgana: 'morgana',
    oberon: 'unknown',
    mordred: 'evil',
    percival: 'unknown',
  };
}
