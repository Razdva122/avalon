import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IEffectPlotCard } from '@/core/game/addons/plot-cards/interface';
import { of, Subject } from 'rxjs';
import { PreVote } from '@/core/game/addons/plot-cards/history/preVote';
import { TVoteOption } from '@avalon/types';
import _ from 'lodash';

/**
 * activate -> leader give card to some one
 * use -> none
 * effect -> before voting start extra stage
 *
 * observable always true
 */

/**
 * Problems: extra voting stage before original
 */
export class ChargeCard extends AbstractCard implements IEffectPlotCard {
  name = <const>'charge';
  type = <const>'effect';
  playType: AbstractCard['playType'] = 'single';
  preVoteSubject: Subject<true> = new Subject();
  preVote: PreVote | null = null;

  play() {
    if (this.game.turn === 4) {
      return of(true);
    }

    const playersWithCharge = _.uniqBy(
      this.plotCardsAddon.cardsInGame
        .filter((card) => card.name === 'charge')
        .map((card) => this.game.findPlayerByID(card.ownerID!)),
      'user.id',
    );

    this.preVote = new PreVote(playersWithCharge);

    playersWithCharge.forEach((player) => {
      this.activateCard(player.user.id);
    });

    this.game.stage = <const>'preVote';
    this.game.stateObserver.gameStateChanged();

    return this.preVoteSubject.asObservable();
  }

  makeVote(playerID: string, option: TVoteOption): boolean {
    if (!this.preVote) {
      throw new Error('No pre-vote in progress');
    }

    const player = this.game.findPlayerByID(playerID);

    if (!player) {
      throw new Error(`Player with ID ${playerID} not found`);
    }

    const chargeCard = this.plotCardsAddon.cardsInGame.find(
      (card) => card.name === 'charge' && card.ownerID === playerID,
    );

    if (!chargeCard) {
      throw new Error(`Player with ID ${playerID} dont have charge card`);
    }

    chargeCard.stage = 'has';

    const allVoted = this.preVote.makeVote(player, option);
    this.game.stateObserver.gameStateChanged();

    if (allVoted) {
      this.game.history.push(this.preVote);
      this.game.vote!.data.votes.forEach((vote) => {
        const preVoteValue = this.preVote!.data.votes.find((preVote) => preVote.player === vote.player)?.value;

        if (preVoteValue) {
          vote.value = preVoteValue;
          vote.preVote = <TVoteOption>preVoteValue;
        }
      });
      this.preVoteSubject.next(true);
    }

    return allVoted;
  }
}
