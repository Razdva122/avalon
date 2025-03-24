import { IGameAddon } from '@/core/game/addons/interface';
import { Observable, of, concatMap, from, takeWhile, last, defaultIfEmpty, Subject } from 'rxjs';
import * as _ from 'lodash';
import { Game } from '@/core/game';
import { Dictionary, AddonsData } from '@avalon/types';
import { TPlotCard, ICurrentCardsState, ICardState } from '@/core/game/addons/plot-cards/interface';

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
  currentCards: ICurrentCardsState = { cards: [], pointer: 0 };
  cardsInGame: { ownerID: string; card: TPlotCard }[] = [];
  giveCardSubject: Subject<true> = new Subject();

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

  get addonData(): AddonsData {
    return {
      plotCards: {
        cardsState: {
          usedCards: this.cards.slice(0, this.pointer).map((el) => el.name),
          remainingCards: this.cards
            .slice(this.pointer)
            .map((el) => el.name)
            .sort(),
        },
        activeCards: [],
      },
    };
  }

  get currentCardState(): ICardState {
    return this.currentCards.cards[this.currentCards.pointer];
  }

  activateCards(): Observable<boolean> {
    const newPointer = this.pointer + this.cardsPerRound;
    this.currentCards = {
      pointer: 0,
      cards: this.cards.slice(this.pointer, newPointer).map((card) => ({ stage: 'pending', card })),
    };
    this.pointer = newPointer;

    return from(this.currentCards.cards).pipe(
      concatMap((data, index) => {
        if (index !== 0) {
          this.currentCardState.stage === 'used';
          this.game.stateObserver.gameStateChanged();
        }

        this.currentCards.pointer = index;

        return this.waitForGiveCard().pipe(
          concatMap(() => {
            if (data.card.type === 'instant') {
              this.currentCardState.stage = 'active';
              this.game.stateObserver.gameStateChanged();
              return this.playCardIfExist(data.card.name);
            }

            return of(true);
          }),
        );
      }),
      last(),
    );
  }

  waitForGiveCard() {
    this.currentCardState.stage = 'selectionInProgress';
    this.game.stateObserver.gameStateChanged();

    if (this.currentCardState.card.activate === 'self') {
      this.cardsInGame.push({ card: this.currentCardState.card, ownerID: this.game.leader.user.id });
      return of(true);
    }

    return this.giveCardSubject;
  }

  giveCardToPlayer(playerID: string) {
    this.cardsInGame.push({ card: this.currentCardState.card, ownerID: playerID });
    this.giveCardSubject.next(true);
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
      defaultIfEmpty(true),
      last(),
    );
  }
}
