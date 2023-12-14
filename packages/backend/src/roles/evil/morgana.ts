import { Character } from '@/roles/abstract';
import type { TVisibility } from '@/roles/interface';
import type { TLoyalty, TRoles } from '@avalon/types';

export class Morgana extends Character {
	role: TRoles = 'morgana';
	selfRole: TRoles = 'morgana';
	loyalty: TLoyalty = 'evil';

	visibility: TVisibility = {
		servant: 'unknown',
		minion: 'evil',
		merlin: 'unknown',
		morgana: 'evil'
	};
}
