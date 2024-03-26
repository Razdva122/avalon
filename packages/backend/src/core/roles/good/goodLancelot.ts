import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class GoodLancelot extends Character {
  role: TRoles = 'goodLancelot';
  selfRole: TRoles = 'goodLancelot';
  loyalty: TLoyalty = 'good';

  visibility: TVisibility = {};
}
