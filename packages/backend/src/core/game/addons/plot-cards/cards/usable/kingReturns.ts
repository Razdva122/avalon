import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';
import { Subject } from 'rxjs';
import { KingReturns } from '@/core/game/addons/plot-cards/history';

/**
 * activate -> leader give card to some one
 * use -> can decline voting and move leader
 * effect -> after every success voting use or skip
 *
 * observable false if used
 */

/**
 * Problems: multi kings returns in game
 */
export class KingReturnsCard extends AbstractCard implements IUsablePlotCard {
  name = <const>'kingReturns';
  type = <const>'usable';
  kingReturnsSubject: Subject<boolean> = new Subject();

  play(ownerID: string) {
    this.activateCard(ownerID);
    this.game.stage = 'kingReturns';
    this.game.stateObserver.gameStateChanged();
    return this.kingReturnsSubject.asObservable();
  }

  kingReturns(use: boolean) {
    const owner = this.game.findPlayerByID(this.ownerID!);
    owner.features.waitForAction = false;

    if (use) {
      const kingReturnsHistory = new KingReturns(owner);
      this.game.history.push(kingReturnsHistory);

      this.plotCardsAddon.removeCardFromGame(this);
      this.game.moveVote();
      this.kingReturnsSubject.next(false);
    } else {
      this.stage = 'has';
      this.kingReturnsSubject.next(true);
    }
  }
}
