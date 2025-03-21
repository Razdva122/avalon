import { Game } from '@/core/game';

export type TPlotCard = IEffectPlotCard | IUsablePlotCard | IInstantPlotCard;

export interface IEffectPlotCard {
  type: 'effect';
  name: 'charge';
  game: Game;
}

export interface IUsablePlotCard {
  type: 'usable';
  name: 'takingCharge' | 'stayingAlert' | 'kingReturns' | 'weFoundYou';
  game: Game;
}

export interface IInstantPlotCard {
  type: 'instant';
  name: 'restoreHonor' | 'showStrength' | 'showNature' | 'areYouTheOne';
  game: Game;
}
