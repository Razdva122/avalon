export * from '@/roles/interface'
export * from '@/roles/abstract'

/**
 * Evil roles
 */
import { Minion } from '@/roles/evil/minion'
import { Morgana } from '@/roles/evil/morgana'
import { Oberon } from '@/roles/evil/oberon'
import { Mordred } from '@/roles/evil/mordred'

export const evilRoles = {
  minion: Minion,
  morgana: Morgana,
  oberon: Oberon,
  mordred: Mordred,
} as const

/**
 * Good roles
 */
import { Servant } from '@/roles/good/servant'
import { Merlin } from '@/roles/good/merlin'
import { Percival } from '@/roles/good/percival'

export const goodRoles = {
  servant: Servant,
  merlin: Merlin,
  percival: Percival,
} as const

const roles = {
  ...evilRoles,
  ...goodRoles,
} as const

export default roles
