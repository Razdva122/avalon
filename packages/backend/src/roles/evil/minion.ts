import { Character } from '@/roles/abstract';
import type { TVisibility } from '@/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Minion extends Character {
	role: TRoles = 'minion';
	selfRole: TRoles = 'minion';
	loyalty: TLoyalty = 'evil';

	visibility: TVisibility = {
		servant: 'unknown',
		minion: 'evil',
		merlin: 'unknown',
		morgana: 'morgana',
		oberon: 'unknown',
		mordred: 'mordred'
	};
}
