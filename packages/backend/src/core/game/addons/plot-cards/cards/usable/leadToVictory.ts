import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';
import { Subject, of } from 'rxjs';
import { LeadToVictoryHistory } from '@/core/game/addons/plot-cards/history/leadToVictory';

/**
 * activate -> leader give card to some one
 * use -> player become leader
 * effect -> before every team selection player can use or skip
 */

/**
 * Problems: multi lead to victory
 */
export class LeadToVictoryCard extends AbstractCard implements IUsablePlotCard {
  name = <const>'leadToVictory';
  type = <const>'usable';
  leadToVictorySubject: Subject<true> = new Subject();

  play(ownerID: string) {
    if (ownerID === this.game.leader.userID || this.plotCardsAddon.crossCardsStorage.isLeadToVictoryDisabled) {
      return of(true);
    }

    this.activateCard(ownerID);
    this.game.stage = 'leadToVictory';
    this.game.leader.features.waitForAction = false;
    this.game.stateObserver.gameStateChanged();
    return this.leadToVictorySubject.asObservable();
  }

  leadToVictory(playerID: string, use: boolean) {
    if (this.game.stage !== 'leadToVictory') {
      throw new Error(`You cant use leadToVictory on stage: ${this.game.stage}`);
    }

    const player = this.game.findPlayerByID(playerID);

    if (use) {
      this.game.history.push(new LeadToVictoryHistory(player, this.game.leader));
      this.game.leader = player;
      this.plotCardsAddon.crossCardsStorage.isLeadToVictoryDisabled = true;
      this.plotCardsAddon.removeCardFromGame(this);
    } else {
      player.features.waitForAction = false;
      this.game.leader.features.waitForAction = true;
      this.stage = 'has';
    }

    this.game.stateObserver.gameStateChanged();
    this.leadToVictorySubject.next(true);
  }
}
