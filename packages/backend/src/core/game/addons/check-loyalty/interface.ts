import { IPlayerInGame } from '@/core/game';
import { TLoyalty, TRoles } from '@avalon/types';

export interface ILoyaltyActionHandler {
  preCheckAction?(executorID: string, ownerOfCheck: IPlayerInGame, selectedPlayer: IPlayerInGame): void;
  postAnnounceAction(ownerOfCheck: IPlayerInGame, selectedPlayer: IPlayerInGame): void;
  updateVisibleRoles?(owner: IPlayerInGame, selectedPlayer: IPlayerInGame): void;
  calculateLoyalty?(selectedPlayer: IPlayerInGame): TLoyalty | TRoles;
}
