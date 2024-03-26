import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class EvilLancelot extends Character {
  role: TRoles = 'evilLancelot';
  selfRole: TRoles = 'evilLancelot';
  loyalty: TLoyalty = 'evil';

  visibility: TVisibility = {};
}
