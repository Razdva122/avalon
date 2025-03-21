import { IGameAddon } from '@/core/game/addons/interface';
import { Subject, of } from 'rxjs';
import * as _ from 'lodash';
import { Game } from '@/core/game';
import { Dictionary } from '@avalon/types';
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
  subjects: Dictionary<Subject<boolean>> = {
    startMission: new Subject(),
    takingCharge: new Subject(),
    stayingAlert: new Subject(),
    charge: new Subject(),
  };

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
    return this.subjects.startMission.asObservable();
  }

  beforeSelectTeam() {
    if (this.game.players.some((player) => player.features.takingChargeCard)) {
      return this.subjects.takingCharge.asObservable();
    }

    return of(true);
  }

  beforeEndMission() {
    if (this.game.players.some((player) => player.features.stayingAlertCard)) {
      return this.subjects.stayingAlert.asObservable();
    }

    return of(true);
  }

  beforeVoteForTeam() {
    if (this.game.players.some((player) => player.features.chargeCard)) {
      return this.subjects.chargeCard.asObservable();
    }

    return of(true);
  }
}
