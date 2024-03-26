import { Character } from '@/core/roles/abstract';
import type { TVisibility } from '@/core/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class MerlinPure extends Character {
  role: TRoles = 'merlinPure';
  selfRole: TRoles = 'merlinPure';
  loyalty: TLoyalty = 'good';

  visibility: TVisibility = {
    minion: 'minion',
    morgana: 'morgana',
    oberon: 'oberon',
    evilLancelot: 'evilLancelot',
  };
}
