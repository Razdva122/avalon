import { Character } from '@/roles/abstract'
import type { TVisibility } from '@/roles/interface'
import type { TLoyalty, TRoles } from '@avalon/types'

export class Servant extends Character {
  role: TRoles = 'servant'
  selfRole: TRoles = 'servant'
  loyalty: TLoyalty = 'good'

  visibility: TVisibility = {
    servant: 'unknown',
    minion: 'unknown',
    merlin: 'unknown',
    morgana: 'unknown',
    oberon: 'unknown',
    mordred: 'unknown',
    percival: 'percival',
  }
}
