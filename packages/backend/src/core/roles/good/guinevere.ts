import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Guinevere extends Character {
  role: TRoles = 'guinevere';
  selfRole: TRoles = 'guinevere';
  loyalty: TLoyalty = 'good';

  visibility: TVisibility = {
    evilLancelot: 'unknownLancelot',
    goodLancelot: 'unknownLancelot',
  };
}
