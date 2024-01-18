import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Mordred extends Character {
  role: TRoles = 'mordred';
  selfRole: TRoles = 'mordred';
  loyalty: TLoyalty = 'evil';

  visibility: TVisibility = {
    servant: 'unknown',
    minion: 'evil',
    merlin: 'unknown',
    merlinPure: 'unknown',
    morgana: 'evil',
    oberon: 'unknown',
    mordred: 'evil',
    percival: 'unknown',
  };
}
