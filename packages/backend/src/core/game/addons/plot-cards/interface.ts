import { Game } from '@/core/game';
import { TEffectsCardNames, TUsableCardNames, TInstantCardNames, TActiveCardsStages } from '@avalon/types';
import { Observable } from 'rxjs';

export type TPlotCard = IEffectPlotCard | IUsablePlotCard | IInstantPlotCard;

export interface IEffectPlotCard {
  type: 'effect';
  activate: 'self' | 'select';
  name: TEffectsCardNames;
  game: Game;
  play(): Observable<boolean>;
}

export interface IUsablePlotCard {
  type: 'usable';
  activate: 'self' | 'select';
  name: TUsableCardNames;
  game: Game;
  play(): Observable<boolean>;
}

export interface IInstantPlotCard {
  type: 'instant';
  activate: 'self' | 'select';
  name: TInstantCardNames;
  game: Game;
  play(): Observable<boolean>;
}

export interface ICurrentCardsState {
  cards: Array<ICardState>;
  pointer: number;
}

export interface ICardState {
  stage: TActiveCardsStages;
  card: TPlotCard;
}
