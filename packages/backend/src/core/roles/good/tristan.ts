import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Tristan extends Character {
  role: TRoles = 'tristan';
  selfRole: TRoles = 'tristan';
  loyalty: TLoyalty = 'good';

  visibility: TVisibility = {
    isolde: 'isolde',
  };
}
