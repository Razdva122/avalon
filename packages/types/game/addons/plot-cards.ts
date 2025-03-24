import { prop } from '@typegoose/typegoose';

export type TPlotCardNames = TUsableCardNames | TInstantCardNames | TEffectsCardNames;

export type TUsableCardNames = 'takingCharge' | 'stayingAlert' | 'kingReturns' | 'weFoundYou';

export type TInstantCardNames = 'restoreHonor' | 'showStrength' | 'showNature' | 'areYouTheOne';

export type TEffectsCardNames = 'charge';

export type TActiveCardsStages = 'pending' | 'selectionInProgress' | 'active' | 'used';

/**
 * Data for game
 */
export class PlotCardsAddonData {
  @prop({ required: true, type: () => [ActiveCard] })
  public activeCards!: Array<ActiveCard>;

  @prop({ required: true, type: () => CardsState })
  public cardsState!: CardsState;
}

export class ActiveCard {
  @prop({ required: true })
  public stage!: TActiveCardsStages;

  @prop({ required: true })
  public name!: TPlotCardNames;
}

export class CardsState {
  @prop({ required: true, type: () => [String] })
  public usedCards!: Array<TPlotCardNames>;

  @prop({ required: true, type: () => [String] })
  public remainingCards!: Array<TPlotCardNames>;
}
