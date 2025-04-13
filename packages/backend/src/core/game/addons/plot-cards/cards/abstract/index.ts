import { Game, IPlayerInGame } from '@/core/game';
import { TPlotCardNames } from '@avalon/types';
import { PlotCardsAddon } from '@/core/game/addons/plot-cards';
import { ILoyaltyActionHandler } from '@/core/game/addons/check-loyalty/interface';
import { TPlotCard } from '@/core/game/addons/plot-cards/interface';
import { LoyaltyChecker } from '@/core/game/addons/check-loyalty/loyalty-checker';
import { v4 as uuidv4 } from 'uuid';

export abstract class AbstractCard {
  abstract name: TPlotCardNames;
  abstract type: 'instant' | 'usable' | 'effect';
  id: string = uuidv4();
  ownerID: string | undefined;
  stage: 'has' | 'active' | undefined;
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
   * - 'sequentially': Each card of this type is played sequentially one after another
   * - 'parallel': All cards of this type are played simultaneously
   */
  playType: 'parallel' | 'sequentially' = 'sequentially';

  constructor(game: Game, plotCardsAddon: PlotCardsAddon) {
    this.game = game;
    this.plotCardsAddon = plotCardsAddon;
  }

  activateCard(ownerID: string) {
    const owner = this.game.findPlayerByID(ownerID);
    owner.features.waitForAction = true;
    this.ownerID = ownerID;
    this.stage = 'active';
  }
}

export abstract class LoyaltyPlotCard extends AbstractCard implements ILoyaltyActionHandler {
  abstract loyaltyType: 'checkLoyalty' | 'revealLoyalty';
  loyaltyChecker: LoyaltyChecker;

  constructor(game: Game, addon: PlotCardsAddon) {
    super(game, addon);
    this.loyaltyChecker = new LoyaltyChecker(game, this);
  }

  play(ownerID: string) {
    this.activateCard(ownerID);
    return this.loyaltyChecker.startChecking(this.loyaltyType);
  }

  postAnnounceAction(ownerOfCheck: IPlayerInGame, selectedPlayer: IPlayerInGame): void {
    ownerOfCheck.features.waitForAction = false;
    selectedPlayer.features.isSelected = false;
    this.plotCardsAddon.removeCardFromGame(<TPlotCard>this);
  }
}
