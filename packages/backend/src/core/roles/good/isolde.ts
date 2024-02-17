import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Isolde extends Character {
  role: TRoles = 'isolde';
  selfRole: TRoles = 'isolde';
  loyalty: TLoyalty = 'good';

  visibility: TVisibility = {
    tristan: 'tristan',
  };
}
