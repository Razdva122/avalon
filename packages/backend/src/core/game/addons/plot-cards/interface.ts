import { Game } from '@/core/game';
import { Observable } from 'rxjs';

export type TPlotCard = IEffectPlotCard | IUsablePlotCard | IInstantPlotCard;

export interface IEffectPlotCard {
  type: 'effect';
  activate: 'self' | 'select';
  name: 'charge';
  game: Game;
  play(): Observable<boolean>;
}

export interface IUsablePlotCard {
  type: 'usable';
  activate: 'self' | 'select';
  name: 'takingCharge' | 'stayingAlert' | 'kingReturns' | 'weFoundYou';
  game: Game;
  play(): Observable<boolean>;
}

export interface IInstantPlotCard {
  type: 'instant';
  activate: 'self' | 'select';
  name: 'restoreHonor' | 'showStrength' | 'showNature' | 'areYouTheOne';
  game: Game;
  play(): Observable<boolean>;
}
