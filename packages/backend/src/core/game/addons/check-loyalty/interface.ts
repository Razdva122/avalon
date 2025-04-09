import { IPlayerInGame } from '@/core/game';
import { TLoyalty, TRoles } from '@avalon/types';

export interface ILoyaltyActionHandler {
  postAnnounceAction(ownerOfCheck: IPlayerInGame, selectedPlayer: IPlayerInGame): void;
  updateVisibleRoles?(owner: IPlayerInGame, selectedPlayer: IPlayerInGame): void;
  calculateLoyalty?(selectedPlayer: IPlayerInGame): TLoyalty | TRoles;
}
