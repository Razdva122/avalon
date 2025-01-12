import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Cleric extends Character {
  role: TRoles = 'cleric';
  selfRole: TRoles = 'cleric';
  loyalty: TLoyalty = 'good';

  visibility: TVisibility = {};
}
