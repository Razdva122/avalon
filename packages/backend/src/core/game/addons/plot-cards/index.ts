import { IGameAddon } from '@/core/game/addons/interface';
import { Observable, of, concatMap, from, takeWhile, last, defaultIfEmpty, Subject, tap, take, finalize } from 'rxjs';
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

import { GiveCardHistory } from '@/core/game/addons/plot-cards/history';

export * from '@/core/game/addons/plot-cards/helpers';

export class PlotCardsAddon implements IGameAddon {
  addonName = 'plotCards';
  cardsPerRound: number;
  game: Game;
  cards: TPlotCard[];
  pointer: number = 0;
  currentCards: ICurrentCardsState = { cards: [], pointer: 0 };
  cardsInGame: { ownerID: string; card: TPlotCard }[] = [];
  activeCard: TPlotCard | undefined;
  giveCardSubject: Subject<true> = new Subject();

  constructor(game: Game) {
    this.game = game;

    const cards: Array<new (game: Game, addon: this) => TPlotCard> = [
      LeadToVictoryCard,
      LeadToVictoryCard,
      AmbushCard,
      AmbushCard,
      KingReturnsCard,
      RestoreHonorCard,
      ChargeCard,
    ];

    if (this.game.players.length > 1) {
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

      this.cardsPerRound = this.game.players.length > 1 ? 3 : 2;
    } else {
      this.cardsPerRound = 1;
    }

    this.cards = _.shuffle(cards.map((el) => new el(game, this)));
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
        activeCards: this.currentCards.cards.map(({ card, stage }) => ({ stage, name: card.name })),
      },
    };
  }

  get currentCardState(): ICardState {
    return this.currentCards.cards[this.currentCards.pointer];
  }

  afterInit() {
    this.game.selectAvailable.giveCard = (player) => player.features.isLeader === true;
    this.game.selectAvailable.preVote = (player) => player.features.waitForAction === true;

    return of(true);
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
        this.currentCards.pointer = index;

        return this.waitForGiveCard().pipe(
          take(1),
          concatMap(() => {
            if (data.card.type === 'instant') {
              this.currentCardState.stage = 'active';
              this.game.stateObserver.gameStateChanged();
              return this.playCardIfExist(data.card.name);
            }

            return of(true);
          }),
          finalize(() => {
            this.currentCardState.stage = 'used';
            this.game.stateObserver.gameStateChanged();
          }),
        );
      }),
      finalize(() => {
        this.currentCards = { pointer: 0, cards: [] };
      }),
      last(),
    );
  }

  waitForGiveCard() {
    this.currentCardState.stage = 'selectionInProgress';
    this.game.stage = 'giveCard';

    if (this.currentCardState.card.activate === 'self') {
      this.addCardInGame(this.game.leader.user.id);

      const giveCardHistory = new GiveCardHistory({
        leader: this.game.leader,
        target: 'self',
        cardName: this.currentCardState.card.name,
      });
      this.game.history.push(giveCardHistory);
      this.game.stateObserver.gameStateChanged();

      return of(true);
    }

    this.game.leader.features.waitForAction = true;
    this.game.stateObserver.gameStateChanged();

    return this.giveCardSubject.asObservable();
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

    this.addCardInGame(selectedPlayer.user.id);
    const giveCardHistory = new GiveCardHistory({
      leader: this.game.leader,
      target: 'player',
      owner: selectedPlayer,
      cardName: this.currentCardState.card.name,
    });
    this.game.history.push(giveCardHistory);
    this.game.clearSelectedPlayers();
    this.game.leader.features.waitForAction = false;
    this.game.stateObserver.gameStateChanged();

    this.giveCardSubject.next(true);
  }

  addCardInGame(ownerID: string) {
    this.cardsInGame.push({ card: this.currentCardState.card, ownerID });
    this.game.findPlayerByID(ownerID).features[<keyof PlotCardsFeatures>(this.currentCardState.card.name + 'Card')] =
      'has';
  }

  removeCardFromGame(card: TPlotCard) {
    const state = this.cardsInGame.find((el) => el.card === card);

    if (state) {
      this.cardsInGame = this.cardsInGame.filter((el) => el.card !== card);
      this.game.findPlayerByID(state.ownerID).features[<keyof PlotCardsFeatures>(state.card.name + 'Card')] = undefined;
    }
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
    let cards = this.cardsInGame.filter(({ card }) => card.name === name);

    if (cards.length && cards[0].card.playType === 'single') {
      cards = [cards[0]];
    }

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
      concatMap((cardState) => {
        this.activeCard = cardState.card;
        return cardState.card.play(cardState.ownerID).pipe(
          take(1),
          tap(() => {
            this.activeCard = undefined;
          }),
        );
      }),
      takeWhile((result) => result === true, true),
      defaultIfEmpty(true),
      last(),
    );
  }
}
