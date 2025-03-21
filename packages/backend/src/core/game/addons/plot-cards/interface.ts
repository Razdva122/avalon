import { Game } from '@/core/game';

export type TPlotCard = IEffectPlotCard | IUsablePlotCard | IInstantPlotCard;

export interface IEffectPlotCard {
  type: 'effect';
  activate: 'self' | 'select';
  name: 'charge';
  game: Game;
}

export interface IUsablePlotCard {
  type: 'usable';
  activate: 'self' | 'select';
  name: 'takingCharge' | 'stayingAlert' | 'kingReturns' | 'weFoundYou';
  game: Game;
}

export interface IInstantPlotCard {
  type: 'instant';
  activate: 'self' | 'select';
  name: 'restoreHonor' | 'showStrength' | 'showNature' | 'areYouTheOne';
  game: Game;
}
