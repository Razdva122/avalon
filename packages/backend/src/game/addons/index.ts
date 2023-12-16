export * from '@/game/addons/interface'
export * from '@/game/addons/merlin'

import { MerlinAddon } from '@/game/addons/merlin'

export type TAddonsConstructor = typeof MerlinAddon
