export * from '@/core/roles/interface';
export * from '@/core/roles/abstract';

/**
 * Evil roles
 */
import { Minion } from '@/core/roles/evil/minion';
import { Morgana } from '@/core/roles/evil/morgana';
import { Oberon } from '@/core/roles/evil/oberon';
import { Mordred } from '@/core/roles/evil/mordred';

export const evilRoles = {
  minion: Minion,
  morgana: Morgana,
  oberon: Oberon,
  mordred: Mordred,
} as const;

/**
 * Good roles
 */
import { Servant } from '@/core/roles/good/servant';
import { Merlin } from '@/core/roles/good/merlin';
import { MerlinPure } from '@/core/roles/good/merlinPure';
import { Percival } from '@/core/roles/good/percival';

export const goodRoles = {
  servant: Servant,
  merlin: Merlin,
  merlinPure: MerlinPure,
  percival: Percival,
} as const;

const roles = {
  ...evilRoles,
  ...goodRoles,
} as const;

export default roles;
