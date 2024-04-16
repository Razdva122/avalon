export * from '@/core/roles/interface';
export * from '@/core/roles/abstract';

import type { TEvilRoles, TGoodRoles } from '@avalon/types';

/**
 * Evil roles
 */
import { Minion } from '@/core/roles/evil/minion';
import { Morgana } from '@/core/roles/evil/morgana';
import { Oberon } from '@/core/roles/evil/oberon';
import { Mordred } from '@/core/roles/evil/mordred';
import { EvilLancelot } from '@/core/roles/evil/evilLancelot';
import { Trickster } from '@/core/roles/evil/trickster';

export const evilRoles = {
  minion: Minion,
  morgana: Morgana,
  oberon: Oberon,
  mordred: Mordred,
  evilLancelot: EvilLancelot,
  trickster: Trickster,
} as const;

/**
 * Good roles
 */
import { Servant } from '@/core/roles/good/servant';
import { Merlin } from '@/core/roles/good/merlin';
import { MerlinPure } from '@/core/roles/good/merlinPure';
import { Percival } from '@/core/roles/good/percival';
import { Tristan } from '@/core/roles/good/tristan';
import { Isolde } from '@/core/roles/good/isolde';
import { GoodLancelot } from '@/core/roles/good/goodLancelot';
import { Guinevere } from '@/core/roles/good/guinevere';
import { Troublemaker } from '@/core/roles/good/troublemaker';

export const goodRoles = {
  servant: Servant,
  merlin: Merlin,
  merlinPure: MerlinPure,
  percival: Percival,
  tristan: Tristan,
  isolde: Isolde,
  goodLancelot: GoodLancelot,
  guinevere: Guinevere,
  troublemaker: Troublemaker,
} as const;

const roles = {
  ...evilRoles,
  ...goodRoles,
} as const;

export default roles;

/**
 * The index of the role that displays its importance relative to the rest
 */
export const evilRolesImportance: { [key in TEvilRoles]: number } = {
  mordred: 1,
  morgana: 2,
  oberon: 3,
  trickster: 4,
  evilLancelot: 10,
  minion: 100,
};

/**
 * The index of the role that displays its importance relative to the rest
 */
export const goodRolesImportance: { [key in TGoodRoles]: number } = {
  merlin: 1,
  merlinPure: 2,
  guinevere: 3,
  percival: 4,
  goodLancelot: 5,
  tristan: 10,
  isolde: 11,
  troublemaker: 50,
  servant: 100,
};
