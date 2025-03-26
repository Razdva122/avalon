import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IEffectPlotCard } from '@/core/game/addons/plot-cards/interface';
import { of, Subject } from 'rxjs';

/**
 * activate -> leader give card to some one
 * use -> none
 * effect -> before voting start extra stage
 *
 * observable always false create new vote by care
 */

/**
 * Problems: extra voting stage before original
 */
export class ChargeCard extends AbstractCard implements IEffectPlotCard {
  name = <const>'charge';
  type = <const>'effect';
  preVoteSubject: Subject<false> = new Subject();

  play() {
    if (this.game.turn === 4) {
      return of(true);
    }

    this.game.players
      .filter((player) => player.features.chargeCard === 'has')
      .forEach((player) => {
        this.activateCard(player.user.id);
      });

    this.game.stateObserver.gameStateChanged();
    return this.preVoteSubject.asObservable();
  }

  makeVote() {}
}
