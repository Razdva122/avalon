import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IInstantPlotCard } from '@/core/game/addons/plot-cards/interface';
import { TPlotCardNames, PlotCardsFeatures } from '@avalon/types';
import { of, Subject } from 'rxjs';
import { RestoreHonorHistory } from '@/core/game/addons/plot-cards/history';

/**
 * activate -> leader give card to some one
 * use -> player take plot card from some one
 * effect -> none
 *
 * observable always true
 */

/**
 * Problems: skip stage if another players dont have plot cards
 */
export class RestoreHonorCard extends AbstractCard implements IInstantPlotCard {
  name = <const>'restoreHonor';
  type = <const>'instant';
  activateSubject: Subject<true> = new Subject();

  play(ownerID: string) {
    if (!this.gameHaveCardsToSteal(ownerID)) {
      this.plotCardsAddon.removeCardFromGame(this);
      return of(true);
    }

    this.activateCard(ownerID);
    this.game.stage = 'restoreHonor';
    this.game.stateObserver.gameStateChanged();
    return this.activateSubject.asObservable();
  }

  gameHaveCardsToSteal(ownerID: string): boolean {
    const ownerCards = this.plotCardsAddon.cardsInGame.filter((state) => state.ownerID === ownerID);

    return this.plotCardsAddon.cardsInGame.some((state) => {
      return ownerCards.every((ownerCardState) => state.card.name !== ownerCardState.card.name);
    });
  }

  restoreHonor(cardName: TPlotCardNames, ownerID: string, newOwnerID: string) {
    const card = this.plotCardsAddon.cardsInGame.find(
      (state) => state.card.name === cardName && state.ownerID === ownerID,
    );
    const owner = this.game.findPlayerByID(ownerID);
    const newOwner = this.game.findPlayerByID(newOwnerID);

    if (!card) {
      throw new Error(`Player with ID ${ownerID} dont have card ${cardName}`);
    }

    const featureName = <keyof PlotCardsFeatures>(cardName + 'Card');

    owner.features[featureName] = undefined;
    owner.features.isSelected = false;
    newOwner.features[featureName] = 'has';
    newOwner.features.waitForAction = false;

    card.ownerID = newOwnerID;

    this.game.history.push(new RestoreHonorHistory(owner, newOwner, cardName));

    this.plotCardsAddon.removeCardFromGame(this);

    this.activateSubject.next(true);
  }
}
