import { IGameAddon } from '@/core/game/addons/interface';
import { of } from 'rxjs';
import * as _ from 'lodash';
import { Game } from '@/core/game';

export class PlotCardsAddon implements IGameAddon {
  addonName = 'plotCards';
  cardsPerRound: number;
  game: Game;
  cards: string[];
  pointer: number = 0;
  currentCards: string[] | undefined;

  constructor(game: Game) {
    this.game = game;

    const cards = [
      'Taking Charge',
      'Taking Charge',
      'Staying alert',
      'Staying alert',
      'The king returns',
      'Restore your honor',
      'Charge',
    ];

    if (this.game.players.length > 6) {
      cards.push(
        ...[
          'The king returns',
          'The king returns',
          'Charge',
          'Show your true nature',
          'Are you the one',
          'Are you the one',
          'We found you',
          'Show your strength',
        ],
      );

      this.cardsPerRound = this.game.players.length > 8 ? 3 : 2;
    } else {
      this.cardsPerRound = 1;
    }

    this.cards = _.shuffle(cards);
  }

  beforeStartMission() {
    this.currentCards = this.cards.slice(this.pointer, this.pointer + this.cardsPerRound);
    this.pointer += this.cardsPerRound;

    this.currentCards.forEach((card) => {
      // play card
      console.log('card', card);
    });

    return of(true);
  }
}
