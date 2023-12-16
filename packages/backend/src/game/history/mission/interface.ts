import type { IPlayerInGame } from '@/game'
import type { TMissionResult } from '@avalon/types'

export interface IMissionAction {
  player: IPlayerInGame
  value: TMissionResult | 'unvoted'
}
