import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IInstantPlotCard } from '@/core/game/addons/plot-cards/interface';
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
    return this.plotCardsAddon.cardsInGame.some((el) => el.ownerID !== ownerID);
  }

  restoreHonor(cardID: string, ownerID: string, newOwnerID: string) {
    if (this.game.stage !== 'restoreHonor') {
      throw new Error(`You cant use restoreHonor on stage: ${this.game.stage}`);
    }

    const card = this.plotCardsAddon.cardsInGame.find((card) => card.id === cardID);
    const owner = this.game.findPlayerByID(ownerID);
    const newOwner = this.game.findPlayerByID(newOwnerID);

    if (!card) {
      throw new Error(`Card with id: ${cardID} not in game`);
    }

    owner.features.isSelected = false;
    card.ownerID = newOwnerID;
    newOwner.features.waitForAction = false;

    this.game.history.push(new RestoreHonorHistory(owner, newOwner, card.name));

    this.plotCardsAddon.removeCardFromGame(this);

    this.activateSubject.next(true);
  }
}
