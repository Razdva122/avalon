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
  playType: AbstractCard['playType'] = 'parallel';
  preVoteSubject: Subject<true> = new Subject();

  override activateCard(ownerID: string): void {
    const anotherCardAlreadyActivated = this.plotCardsAddon.cardsInGame.find(
      (card) => card.name === 'charge' && card.ownerID === ownerID && card.stage === 'active',
    );

    if (!anotherCardAlreadyActivated) {
      super.activateCard(ownerID);
    }
  }

  play(ownerID: string) {
    if (this.game.turn === 4) {
      return of(true);
    }

    this.activateCard(ownerID);

    return this.preVoteSubject.asObservable();
  }

  postPlayAction() {
    const playersWithCharge = _.uniqBy(
      this.plotCardsAddon.cardsInGame
        .filter((card) => card.name === 'charge')
        .map((card) => this.game.findPlayerByID(card.ownerID!)),
      'user.id',
    );

    this.plotCardsAddon.crossCardsStorage.chargePreVote = new PreVote(playersWithCharge);

    this.game.stage = <const>'preVote';
    this.game.stateObserver.gameStateChanged();
  }

  makeVote(option: TVoteOption): boolean {
    const preVote = this.plotCardsAddon.crossCardsStorage.chargePreVote;

    if (!preVote) {
      throw new Error('No pre-vote in progress');
    }

    const player = this.game.findPlayerByID(this.ownerID!);

    if (!player) {
      throw new Error(`Player with ID ${this.ownerID} not found`);
    }

    this.stage = 'has';

    const allVoted = preVote.makeVote(player, option);
    this.game.stateObserver.gameStateChanged();

    if (allVoted) {
      this.game.history.push(preVote);
      this.game.vote!.data.votes.forEach((vote) => {
        const preVoteValue = preVote.data.votes.find((preVote) => preVote.player === vote.player)?.value;

        if (preVoteValue) {
          vote.value = preVoteValue;
          vote.preVote = <TVoteOption>preVoteValue;
        }
      });
      this.plotCardsAddon.crossCardsStorage.chargePreVote = undefined;
      this.preVoteSubject.next(true);
    }

    return allVoted;
  }
}
