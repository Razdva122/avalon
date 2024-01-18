import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Servant extends Character {
  role: TRoles = 'servant';
  selfRole: TRoles = 'servant';
  loyalty: TLoyalty = 'good';

  visibility: TVisibility = {
    servant: 'unknown',
    minion: 'unknown',
    merlin: 'unknown',
    merlinPure: 'unknown',
    morgana: 'unknown',
    oberon: 'unknown',
    mordred: 'unknown',
    percival: 'unknown',
  };
}
