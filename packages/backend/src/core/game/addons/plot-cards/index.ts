import { IGameAddon } from '@/core/game/addons/interface';
import { Observable, of, concatMap, from, takeWhile, last, defaultIfEmpty, Subject, tap, take, finalize } from 'rxjs';
import * as _ from 'lodash';
import { Game, IPlayerInGame } from '@/core/game';
import { Dictionary, AddonsData, TPlotCardNames } from '@avalon/types';
import { TPlotCard, ICurrentCardsState, ICardState, ICrossCardsStorage } from '@/core/game/addons/plot-cards/interface';

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

import { GiveCardHistory, PlayCardHistory } from '@/core/game/addons/plot-cards/history';

export * from '@/core/game/addons/plot-cards/helpers';

export class PlotCardsAddon implements IGameAddon {
  addonName = 'plotCards';
  cardsPerRound: number;
  game: Game;
  crossCardsStorage: ICrossCardsStorage = {
    ambushUsedOn: [],
  };
  cards: TPlotCard[];
  pointer: number = 0;
  currentCards: ICurrentCardsState = { cards: [], pointer: 0 };
  cardsInGame: TPlotCard[] = [];
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
        cardsInGame: this.cardsInGame.map((el) => ({
          ownerID: el.ownerID!,
          stage: el.stage!,
          name: el.name,
          id: el.id,
        })),
        activeCards: this.currentCards.cards.map(({ card, stage }) => ({ stage, name: card.name })),
      },
    };
  }

  get currentCardState(): ICardState {
    return this.currentCards.cards[this.currentCards.pointer];
  }

  afterInit() {
    this.game.addSelectAvailableStage('giveCard', (player) => player.features.isLeader === true);
    this.game.addSelectAvailableStage('preVote', (player) => player.features.waitForAction === true);

    const isCardActive = (cardName: TPlotCardNames) => (player: IPlayerInGame) =>
      this.cardsInGame.some(
        (card) => card.name === cardName && card.ownerID === player.user.id && card.stage === 'active',
      );

    this.game.addSelectAvailableStage('ambush', isCardActive('ambush'));
    this.game.addSelectAvailableStage('leadToVictory', isCardActive('leadToVictory'));
    this.game.addSelectAvailableStage('restoreHonor', isCardActive('restoreHonor'));
    this.game.addSelectAvailableStage('kingReturns', isCardActive('kingReturns'));
    this.game.addSelectAvailableStage('weFoundYou', isCardActive('weFoundYou'));

    this.game.addSelectAvailableStage('checkLoyalty', isCardActive('areYouTheOne'));

    this.game.addSelectAvailableStage('revealLoyalty', isCardActive('showNature'));
    this.game.addSelectAvailableStage('revealLoyalty', isCardActive('showStrength'));

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
              const owner = this.game.findPlayerByID(data.card.ownerID!);
              this.game.history.push(new PlayCardHistory({ owner, cardName: data.card.name }));
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
        this.game.leader.features.waitForAction = true;
        this.game.stateObserver.gameStateChanged();
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
    this.currentCardState.card.ownerID = ownerID;
    this.currentCardState.card.stage = 'has';
    this.cardsInGame.push(this.currentCardState.card);
  }

  removeCardFromGame(card: TPlotCard) {
    const cardInGame = this.cardsInGame.find((el) => el === card);

    if (cardInGame) {
      cardInGame.ownerID = undefined;
      cardInGame.stage = undefined;
      this.cardsInGame = this.cardsInGame.filter((el) => el !== card);
    }
  }

  beforeStartMission() {
    this.crossCardsStorage.ambushUsedOn = [];

    return of(true).pipe(
      concatMap(() => this.playCardIfExist('kingReturns')),
      concatMap((result) => (result ? this.playCardIfExist('weFoundYou') : of(false))),
    );
  }

  beforeSelectTeam() {
    return of(true).pipe(
      concatMap(() => this.playCardIfExist('leadToVictory')),
      concatMap((result) => {
        if (this.game.turn === 0 && result) {
          return this.activateCards();
        }

        return of(result);
      }),
    );
  }

  afterVoteForTeam() {
    this.crossCardsStorage.isLeadToVictoryDisabled = false;
    return of(true);
  }

  beforeEndMission() {
    return this.playCardIfExist('ambush');
  }

  beforeVoteForTeam() {
    return this.playCardIfExist('charge');
  }

  playCardIfExist(name: TPlotCard['name']): Observable<boolean> {
    let cards = this.cardsInGame.filter((card) => card.name === name);

    if (cards.length && cards[0].playType === 'single') {
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
        const posA = a.ownerID ? playerOrder[a.ownerID] : Infinity;
        const posB = b.ownerID ? playerOrder[b.ownerID] : Infinity;

        return posA - posB;
      });
    }

    return from(cards).pipe(
      concatMap((card) => {
        this.activeCard = card;
        return card.play(card.ownerID!).pipe(
          take(1),
          tap(() => {
            if (this.activeCard === card) {
              this.activeCard = undefined;
            }
          }),
        );
      }),
      takeWhile((result) => result === true, true),
      defaultIfEmpty(true),
      last(),
    );
  }
}
