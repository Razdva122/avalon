import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';
import { Game, IPlayerInGame } from '@/core/game';
import { PlotCardsAddon } from '@/core/game/addons/plot-cards';
import { WeFoundYouHistory } from '@/core/game/addons/plot-cards/history/weFoundYou';
import { Subject } from 'rxjs';

/**
 * activate -> leader give card to some one
 * use -> 1 player play mission card visible
 * effect -> after success vote can use or skip
 *
 * observable always true
 */

/**
 * Problems: display one result visible to everyone
 */
export class WeFoundYouCard extends AbstractCard implements IUsablePlotCard {
  name = <const>'weFoundYou';
  type = <const>'usable';
  weFoundYouSubject: Subject<true> = new Subject();

  constructor(game: Game, addon: PlotCardsAddon) {
    super(game, addon);
  }

  play(ownerID: string) {
    this.activateCard(ownerID);
    this.game.stage = 'weFoundYou';
    this.game.stateObserver.gameStateChanged();
    return this.weFoundYouSubject.asObservable();
  }

  weFoundYou(playerID: string, use: true, selectedPlayer: IPlayerInGame): void;
  weFoundYou(playerID: string, use: false, selectedPlayer: undefined): void;
  weFoundYou(playerID: string, use: boolean, selectedPlayer: IPlayerInGame | undefined): void {
    if (this.game.stage !== 'weFoundYou') {
      throw new Error(`You cant use weFoundYou on stage: ${this.game.stage}`);
    }

    const player = this.game.findPlayerByID(playerID);

    if (use === true && selectedPlayer) {
      this.game.history.push(new WeFoundYouHistory(player, selectedPlayer));
      player.features.waitForAction = false;
      selectedPlayer.features.openAction = true;
      selectedPlayer.features.isSelected = false;
      this.plotCardsAddon.removeCardFromGame(this);
    } else {
      player.features.waitForAction = false;
      this.stage = 'has';
    }

    this.game.stateObserver.gameStateChanged();
    this.weFoundYouSubject.next(true);
  }
}
