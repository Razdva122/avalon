export * from '@/roles/interface';
export * from '@/roles/abstract';

/**
 * Evil roles
 */
import { Minion } from '@/roles/evil/minion';
import { Morgana } from '@/roles/evil/morgana';

/**
 * Good roles
 */
import { Servant } from '@/roles/good/servant';
import { Merlin } from '@/roles/good/merlin';

const roles = {
	minion: Minion,
	servant: Servant,
	merlin: Merlin,
	morgana: Morgana
} as const;

export default roles;
