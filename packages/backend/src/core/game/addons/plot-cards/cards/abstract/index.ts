import { Game } from '@/core/game';
import { TPlotCardNames, PlotCardsFeatures } from '@avalon/types';
import { PlotCardsAddon } from '@/core/game/addons/plot-cards';

export abstract class AbstractCard {
  abstract name: TPlotCardNames;
  game: Game;
  plotCardsAddon: PlotCardsAddon;

  /**
   * Determines how the card is distributed to players:
   * - 'select': The lobby leader gives the card to a player at their discretion
   * - 'self': The card is automatically given to the leader themselves
   */
  activate: 'select' | 'self' = 'select';

  /**
   * Determines how multiple cards of the same type are played:
   * - 'single': Each card of this type is played sequentially one after another
   * - 'multiCard': All cards of this type are played simultaneously
   */
  playType: 'single' | 'multiCard' = 'multiCard';

  constructor(game: Game, plotCardsAddon: PlotCardsAddon) {
    this.game = game;
    this.plotCardsAddon = plotCardsAddon;
  }

  activateCard(ownerID: string) {
    const owner = this.game.findPlayerByID(ownerID);
    owner.features.waitForAction = true;
    owner.features[<keyof PlotCardsFeatures>(this.name + 'Card')] = 'active';
  }
}
