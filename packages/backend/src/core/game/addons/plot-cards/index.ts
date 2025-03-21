import { IGameAddon } from '@/core/game/addons/interface';
import { of } from 'rxjs';
import * as _ from 'lodash';
import { Game } from '@/core/game';
import { TPlotCard } from '@/core/game/addons/plot-cards/interface';

import {
  ChargeCard,
  TakingChargeCard,
  StayingAlertCard,
  KingReturnsCard,
  RestoreHonorCard,
  ShowNatureCard,
  AreYouTheOneCard,
  WeFoundYouCard,
  ShowStrengthCard,
} from '@/core/game/addons/plot-cards/cards';

export class PlotCardsAddon implements IGameAddon {
  addonName = 'plotCards';
  cardsPerRound: number;
  game: Game;
  cards: TPlotCard[];
  pointer: number = 0;
  currentCards: TPlotCard[] | undefined;

  constructor(game: Game) {
    this.game = game;

    const cards: Array<new (game: Game) => TPlotCard> = [
      TakingChargeCard,
      TakingChargeCard,
      StayingAlertCard,
      StayingAlertCard,
      KingReturnsCard,
      RestoreHonorCard,
      ChargeCard,
    ];

    if (this.game.players.length > 6) {
      cards.push(
        ...[
          KingReturnsCard,
          KingReturnsCard,
          ChargeCard,
          ShowNatureCard,
          AreYouTheOneCard,
          AreYouTheOneCard,
          WeFoundYouCard,
          ShowStrengthCard,
        ],
      );

      this.cardsPerRound = this.game.players.length > 8 ? 3 : 2;
    } else {
      this.cardsPerRound = 1;
    }

    this.cards = _.shuffle(cards.map((el) => new el(game)));
  }

  beforeStartMission() {
    // Card action kings returns

    this.currentCards = this.cards.slice(this.pointer, this.pointer + this.cardsPerRound);
    this.pointer += this.cardsPerRound;

    this.currentCards.forEach((card) => {
      // play card
      console.log('card', card);
    });

    // Card action weFoundYou

    return of(true);
  }

  beforeSelectTeam() {
    // Card action takingCharge
    return of(true);
  }

  beforeEndMission() {
    // Card action stayingAlert
    return of(true);
  }

  beforeVoteForTeam() {
    // Card action chargeCard
    return of(true);
  }
}
