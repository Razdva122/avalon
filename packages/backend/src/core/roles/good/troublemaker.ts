import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Troublemaker extends Character {
  role: TRoles = 'troublemaker';
  selfRole: TRoles = 'troublemaker';
  loyalty: TLoyalty = 'good';

  visibility: TVisibility = {};

  override get visibleLoyalty(): TLoyalty {
    return 'evil';
  }
}
