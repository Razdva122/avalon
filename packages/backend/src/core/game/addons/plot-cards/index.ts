import { IGameAddon } from '@/core/game/addons/interface';
import { Observable, Subject, of, concatMap, from, takeWhile, last, defaultIfEmpty } from 'rxjs';
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

  cardsInGame: { ownerID: string; card: TPlotCard }[] = [];

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

  activateCards() {
    this.currentCards = this.cards.slice(this.pointer, this.pointer + this.cardsPerRound);
    this.pointer += this.cardsPerRound;

    this.currentCards.forEach((card) => {
      if (card.activate === 'self') {
        this.cardsInGame.push({ card, ownerID: this.game.leader.user.id });
      } else {
        this.giveCardToPlayer(card);
      }

      if (card.type === 'instant') {
        this.playCardIfExist(card.name);
      }
    });

    return of(true);
  }

  giveCardToPlayer(card: TPlotCard) {
    this.cardsInGame.push({ card, ownerID: 'TODO' });
    return of(true);
  }

  beforeStartMission() {
    return of(true).pipe(
      concatMap(() => this.playCardIfExist('kingReturns')),
      concatMap((result) => (result ? this.activateCards() : of(false))),
      concatMap((result) => (result ? this.playCardIfExist('weFoundYou') : of(false))),
    );
  }

  beforeSelectTeam() {
    return this.playCardIfExist('takingCharge');
  }

  beforeEndMission() {
    return this.playCardIfExist('stayingAlert');
  }

  beforeVoteForTeam() {
    return this.playCardIfExist('charge');
  }

  playCardIfExist(name: TPlotCard['name']): Observable<boolean> {
    const cards = this.cardsInGame.filter(({ card }) => card.name === name);

    if (cards.length > 1) {
      const playerOrder: Dictionary<number> = {};
      let player = this.game.leader;
      let position = 0;

      for (let i = 0; i < this.game.players.length; i++) {
        playerOrder[player.user.id] = position++;
        player = player.next;
      }

      cards.sort((a, b) => {
        const posA = playerOrder[a.ownerID] ?? Infinity;
        const posB = playerOrder[b.ownerID] ?? Infinity;

        return posA - posB;
      });
    }

    return from(cards).pipe(
      concatMap(({ card }) => card.play()),
      takeWhile((result) => result === true, true),
      last(),
      defaultIfEmpty(true),
    );
  }
}
