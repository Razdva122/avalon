import { of, Subject } from 'rxjs';
import type { Game } from '@/core/game';
import type { IGameAddon } from '@/core/game/addons/interface';
import { SwitchResult } from '@/core/game/addons/excalibur/switch-result';
import { DiscardMissionCardHistory } from './history';

export class TrapperAddon implements IGameAddon {
  addonName = 'trapper';
  private readonly discarded = new Subject<boolean>();

  constructor(public game: Game) {}

  afterInit() {
    this.game.addSelectAvailableStage('discardMissionCard', (player) => player === this.game.leader);
    return of(true);
  }

  beforeEndMission() {
    this.game.clearSelectedPlayers();
    this.game.stage = 'discardMissionCard';
    this.game.leader.features.waitForAction = true;
    const previous = this.game.history[this.game.history.length - 1];
    const swordDelay = previous instanceof SwitchResult ? (previous.data.target ? 3000 : 2000) : 0;
    this.game.timer.setHistoryDelay(swordDelay);
    this.game.timer.startTimer('discardMissionCard');
    this.game.stateObserver.gameStateChanged();
    return this.discarded.asObservable();
  }

  discardMissionCard(executorID: string) {
    if (this.game.stage !== 'discardMissionCard') throw new Error('Not the Trapper stage');
    if (executorID !== this.game.leader.userID) throw new Error('Only the leader can exclude a card');
    if (this.game.selectedPlayers.length !== 1) throw new Error('Select exactly one mission participant');
    const target = this.game.selectedPlayers[0];
    const action = this.game.currentMission.data.actions.find((item) => item.player === target);
    if (!action || action.value === 'unvoted' || action.discarded) throw new Error('Select a played mission card');

    action.discarded = true;
    this.game.history.push(new DiscardMissionCardHistory(this.game.leader, target, action.value));
    this.game.clearSelectedPlayers();
    this.game.leader.features.waitForAction = false;
    this.game.timer.clearTimer();
    this.discarded.next(true);
  }
}
