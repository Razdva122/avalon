import { IGameAddon } from '@/core/game/addons/interface';
import { Observable, of, concatMap, from, takeWhile, last, defaultIfEmpty, Subject } from 'rxjs';
import * as _ from 'lodash';
import { Game } from '@/core/game';
import { Dictionary, AddonsData, PlotCardsFeatures } from '@avalon/types';
import { TPlotCard, ICurrentCardsState, ICardState } from '@/core/game/addons/plot-cards/interface';

import {
  ChargeCard,
  LeadToVictoryCard,
  AmbushCard,
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
      LeadToVictoryCard,
      LeadToVictoryCard,
      AmbushCard,
      AmbushCard,
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

  afterInit() {
    this.game.selectAvailable.plotCards = (player) => player.features.isLeader === true;

    return of(true);
  }

  activateCards(): Observable<boolean> {
    const newPointer = this.pointer + this.cardsPerRound;
    this.currentCards = {
      pointer: 0,
      cards: this.cards.slice(this.pointer, newPointer).map((card) => ({ stage: 'pending', card })),
    };
    this.pointer = newPointer;
    this.game.stage = 'plotCards';
    this.game.stateObserver.gameStateChanged();

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

    if (this.currentCardState.card.activate === 'self') {
      this.cardsInGame.push({ card: this.currentCardState.card, ownerID: this.game.leader.user.id });
      return of(true);
    }

    this.game.leader.features.waitForAction = true;
    this.game.stateObserver.gameStateChanged();

    return this.giveCardSubject;
  }

  giveCardToPlayer(userID: string) {
    const leader = this.game.players.find((player) => player.user.id === userID);

    if (leader !== this.game.leader) {
      throw new Error('Only leader can give cards to player');
    }

    if (this.game.selectedPlayers.length !== 1) {
      throw new Error('Only one player can be selected to give a plot card');
    }

    const selectedPlayer = this.game.selectedPlayers[0];

    if (selectedPlayer === this.game.leader) {
      throw new Error('You cannot give a plot card to yourself');
    }

    const featureName = <keyof PlotCardsFeatures>(this.currentCardState.card.name + 'Card');

    if (selectedPlayer.features[featureName]) {
      throw new Error('Selected player already have this plot card');
    }

    this.cardsInGame.push({ card: this.currentCardState.card, ownerID: selectedPlayer.user.id });
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
    return this.playCardIfExist('leadToVictory');
  }

  beforeEndMission() {
    return this.playCardIfExist('ambush');
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
