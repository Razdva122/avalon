import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Percival extends Character {
  role: TRoles = 'percival';
  selfRole: TRoles = 'percival';
  loyalty: TLoyalty = 'good';

  visibility: TVisibility = {
    servant: 'unknown',
    minion: 'unknown',
    merlin: 'merlin/morgana',
    morgana: 'merlin/morgana',
    oberon: 'unknown',
    mordred: 'unknown',
    percival: 'unknown',
  };
}