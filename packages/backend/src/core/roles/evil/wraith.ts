import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Wraith extends Character {
  role: TRoles = 'wraith';
  selfRole: TRoles = 'wraith';
  loyalty: TLoyalty = 'evil';

  visibility: TVisibility = {};
}
