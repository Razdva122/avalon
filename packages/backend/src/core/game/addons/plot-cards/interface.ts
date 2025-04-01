import { Game } from '@/core/game';
import { TEffectsCardNames, TUsableCardNames, TInstantCardNames, TActiveCardsStages } from '@avalon/types';
import { Observable } from 'rxjs';

export type TPlotCard = IEffectPlotCard | IUsablePlotCard | IInstantPlotCard;

/**
 * Base interface for all plot cards with common properties
 */
export interface IBasePlotCard {
  id: string;
  ownerID: string | undefined;
  stage: 'has' | 'active' | undefined;

  /**
   * Determines how the card is distributed to players:
   * - 'select': The lobby leader gives the card to a player at their discretion
   * - 'self': The card is automatically given to the leader themselves
   */
  activate: 'self' | 'select';

  /**
   * Determines how multiple cards of the same type are played:
   * - 'single': Each card of this type is played sequentially one after another
   * - 'multiCard': All cards of this type are played simultaneously
   */
  playType: 'single' | 'multiCard';

  game: Game;
  play(ownerID: string): Observable<boolean>;
}

export interface IEffectPlotCard extends IBasePlotCard {
  type: 'effect';
  name: TEffectsCardNames;
}

export interface IUsablePlotCard extends IBasePlotCard {
  type: 'usable';
  name: TUsableCardNames;
}

export interface IInstantPlotCard extends IBasePlotCard {
  type: 'instant';
  name: TInstantCardNames;
}

export interface ICurrentCardsState {
  cards: Array<ICardState>;
  pointer: number;
}

export interface ICardState {
  stage: TActiveCardsStages;
  card: TPlotCard;
}

export interface ICrossCardsStorage {
  isLeadToVictoryDisabled?: boolean;
  ambushUsedOn: string[];
}
