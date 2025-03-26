import { prop } from '@typegoose/typegoose';

import type { TLadyOfLakeStages } from './lady-of-lake';
import type { LadyOfSeaAddonData } from './lady-of-sea';
import type { PlotCardsAddonData, TPlotCardsStages } from './plot-cards';
import type { TExcaliburStages } from './excalibur';
import type { TLancelotsStages } from './lancelots';
import type { TWitchStages } from './witch';
import type { TAssassinAddonStages } from './assassin';
import { AssassinAddonData } from './assassin';

export * from './loyalty';

export type { TAssassinateResult, TAssassinateType, AssassinAddonData, AssassinateProgressData } from './assassin';

export type {
  TUsableCardNames,
  TEffectsCardNames,
  TInstantCardNames,
  TPlotCardNames,
  PlotCardsAddonData,
  TActiveCardsStages,
  CardsState,
  ActiveCard,
} from './plot-cards';

/**
 * Possible addons stages
 */
export type TAddonsStages =
  | TLadyOfLakeStages
  | TExcaliburStages
  | TAssassinAddonStages
  | TLancelotsStages
  | TWitchStages
  | TPlotCardsStages;

/**
 * Features for plot cards addon
 */
export class PlotCardsFeatures {
  /**
   * Voting first
   */
  @prop()
  chargeCard?: 'has' | 'active';

  /**
   * Take plot card from another player
   */
  @prop()
  restoreHonorCard?: 'has' | 'active';

  /**
   * Leader reveal loyalty to some one
   */
  @prop()
  showStrengthCard?: 'has' | 'active';

  /**
   * Player reveal loyalty to some one
   */
  @prop()
  showNatureCard?: 'has' | 'active';

  /**
   * Player check loyalty of right or left player
   */
  @prop()
  areYouTheOneCard?: 'has' | 'active';

  /**
   * Player become a leader
   */
  @prop()
  leadToVictoryCard?: 'has' | 'active';

  /**
   * Check mission card of one player
   */
  @prop()
  ambushCard?: 'has' | 'active';

  /**
   * Сancel the previous mission and pass the leader to the next player
   */
  @prop()
  kingReturnsCard?: 'has' | 'active';

  /**
   * Select player after success voting he play mission card open
   */
  @prop()
  weFoundYouCard?: 'has' | 'active';
}

/**
 * Player features added with addons
 */
export class AddonsFeatures extends PlotCardsFeatures {
  /**
   * A sign that the player has the Lady of the Lake ability or not
   */
  @prop()
  ladyOfLake?: 'has' | 'used';

  /**
   * A sign that the player has the Lady of the sea ability or not
   */
  @prop()
  ladyOfSea?: 'has' | 'used';

  /**
   * A sign that the player has the excalibur
   */
  @prop()
  excalibur?: boolean;

  /**
   * True if player assassin
   */
  @prop()
  isAssassin?: boolean;

  /**
   * True if player get witch loyalty
   */
  @prop()
  witchLoyalty?: boolean;
}

/**
 * Addons data
 */
export class AddonsData {
  @prop({ _id: false })
  public assassin?: AssassinAddonData;

  @prop({ _id: false })
  public ladyOfSea?: LadyOfSeaAddonData;

  @prop({ _id: false })
  public plotCards?: PlotCardsAddonData;
}

/**
 * Addons names
 */
export type TAddonsName = 'ladyOfLake' | 'excalibur' | 'ladyOfSea' | 'plotCards';
