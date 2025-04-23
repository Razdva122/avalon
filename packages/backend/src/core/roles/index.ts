export * from '@/core/roles/interface';
export * from '@/core/roles/abstract';

/**
 * Evil roles
 */
import { Minion } from '@/core/roles/evil/minion';
import { Morgana } from '@/core/roles/evil/morgana';
import { Oberon } from '@/core/roles/evil/oberon';
import { Mordred } from '@/core/roles/evil/mordred';
import { EvilLancelot } from '@/core/roles/evil/evilLancelot';
import { Trickster } from '@/core/roles/evil/trickster';
import { Lunatic } from '@/core/roles/evil/lunatic';
import { Brute } from '@/core/roles/evil/brute';
import { Witch } from '@/core/roles/evil/witch';
import { Revealer } from '@/core/roles/evil/revealer';
import { Wraith } from '@/core/roles/evil/wraith';

export const evilRoles = {
  minion: Minion,
  morgana: Morgana,
  oberon: Oberon,
  mordred: Mordred,
  evilLancelot: EvilLancelot,
  trickster: Trickster,
  lunatic: Lunatic,
  brute: Brute,
  witch: Witch,
  revealer: Revealer,
  wraith: Wraith,
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
import { Cleric } from '@/core/roles/good/cleric';

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
  cleric: Cleric,
} as const;

const roles = {
  ...evilRoles,
  ...goodRoles,
} as const;

export default roles;
