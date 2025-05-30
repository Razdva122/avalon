import { Game, IPlayerInGame } from '@/core/game';
import { TLoyalty, TRoles } from '@avalon/types';
import {
  CheckLoyaltyHistory,
  RevealLoyaltyHistory,
  AnnounceLoyaltyHistory,
} from '@/core/game/addons/check-loyalty/history';
import { Dictionary, TVisibleRole } from '@avalon/types';
import { Observable, Subject } from 'rxjs';
import { ILoyaltyActionHandler } from '@/core/game/addons/check-loyalty/interface';

export class LoyaltyChecker {
  game: Game;
  loyaltySubject: Subject<boolean> = new Subject();
  private actionHandler?: ILoyaltyActionHandler;

  constructor(game: Game, actionHandler?: ILoyaltyActionHandler) {
    this.game = game;
    this.actionHandler = actionHandler;
  }

  startChecking(type: 'checkLoyalty' | 'revealLoyalty'): Observable<boolean> {
    this.game.stage = type;
    if (this.game.isTimerEnabled) {
      this.game.timer.startTimer(type);
    }
    this.game.stateObserver.gameStateChanged();
    return this.loyaltySubject;
  }

  checkLoyalty(executorID: string, ownerOfCheck: IPlayerInGame, selectedPlayer: IPlayerInGame): void {
    if (this.actionHandler?.preCheckAction) {
      this.actionHandler?.preCheckAction(executorID, ownerOfCheck, selectedPlayer);
    }

    if (this.game.stage !== 'checkLoyalty') {
      throw new Error(`You cant check loyalty on stage ${this.game.stage}`);
    }

    if (ownerOfCheck.userID !== executorID) {
      throw new Error(`Only owner of check can check loyalty`);
    }

    if (selectedPlayer === ownerOfCheck) {
      throw new Error(`You can't check your own loyalty`);
    }

    this.game.stage = 'announceLoyalty';
    if (this.game.isTimerEnabled) {
      this.game.timer.startTimer('announceLoyalty');
    }
    const loyaltyCheck = new CheckLoyaltyHistory(ownerOfCheck, selectedPlayer);
    this.game.history.push(loyaltyCheck);
    this.game.stateObserver.gameStateChanged();
  }

  revealLoyalty(executorID: string, ownerOfReveal: IPlayerInGame, targetPlayer: IPlayerInGame): void {
    if (this.game.stage !== 'revealLoyalty') {
      throw new Error(`You cant reveal loyalty on stage ${this.game.stage}`);
    }

    if (ownerOfReveal.userID !== executorID) {
      throw new Error(`Only owner of reveal can reveal loyalty`);
    }

    if (targetPlayer === ownerOfReveal) {
      throw new Error(`You can't reveal your loyalty to yourself`);
    }

    this.game.stage = 'announceLoyalty';
    if (this.game.isTimerEnabled) {
      this.game.timer.startTimer('announceLoyalty');
    }
    targetPlayer.features.waitForAction = true;
    targetPlayer.features.isSelected = false;
    ownerOfReveal.features.waitForAction = false;
    ownerOfReveal.features.isSelected = true;
    const loyaltyReveal = new RevealLoyaltyHistory(ownerOfReveal, targetPlayer);
    this.game.history.push(loyaltyReveal);
    this.game.stateObserver.gameStateChanged();
  }

  getLoyalty(executorID: string, selectedPlayer: IPlayerInGame): TLoyalty | TRoles {
    if (this.game.stage !== 'announceLoyalty') {
      throw new Error(`You cant get loyalty on stage ${this.game.stage}`);
    }

    const executor = this.game.findPlayerByID(executorID);

    if (executor?.features.waitForAction !== true) {
      throw new Error(`You cant get loyalty`);
    }

    return this.calculateLoyalty(selectedPlayer);
  }

  protected calculateLoyalty(selectedPlayer: IPlayerInGame): TLoyalty | TRoles {
    if (this.actionHandler?.calculateLoyalty) {
      return this.actionHandler?.calculateLoyalty(selectedPlayer);
    }

    return selectedPlayer.role.visibleLoyalty;
  }

  announceLoyalty(executorID: string, selectedPlayer: IPlayerInGame, loyalty: TLoyalty | TRoles): void {
    if (this.game.stage !== 'announceLoyalty') {
      throw new Error(`You cant announce loyalty on stage ${this.game.stage}`);
    }

    const executor = this.game.findPlayerByID(executorID);

    if (executor?.features.waitForAction !== true) {
      throw new Error(`You cant get loyalty`);
    }

    const actualLoyalty = this.getLoyalty(executorID, selectedPlayer);

    const loyaltyAnnounce = new AnnounceLoyaltyHistory(executor, selectedPlayer, loyalty, actualLoyalty);
    this.game.history.push(loyaltyAnnounce);

    this.updateVisibleRoles(executor, selectedPlayer);
    this.postAnnounceAction(executor, selectedPlayer);
    this.game.timer.clearTimer();
    this.loyaltySubject.next(true);
  }

  updateVisibleRoles(owner: IPlayerInGame, selectedPlayer: IPlayerInGame): void {
    const ownerRole = owner.role.role;
    const selectedPlayerRole = selectedPlayer.role.role;

    if (ownerRole === 'percival') {
      if (selectedPlayerRole.startsWith('merlin') || selectedPlayerRole === 'morgana') {
        const merlin = this.game.players.find((player) => player.role.role.startsWith('merlin'));
        const morgana = this.game.players.find((player) => player.role.role === 'morgana');

        const roles: Dictionary<TVisibleRole> = {};

        if (merlin) {
          roles[merlin.userID] = merlin.role.role;
        }

        if (morgana) {
          roles[morgana.userID] = morgana.role.role;
        }

        this.game.updateVisibleRolesState(owner.userID, roles);
      }
    }

    if (ownerRole === 'guinevere') {
      if (selectedPlayerRole === 'evilLancelot' || selectedPlayerRole === 'goodLancelot') {
        const goodLancelot = this.game.players.find((player) => player.role.role === 'goodLancelot')!;
        const evilLancelot = this.game.players.find((player) => player.role.role === 'evilLancelot')!;

        this.game.updateVisibleRolesState(owner.userID, {
          [goodLancelot.userID]: 'goodLancelot',
          [evilLancelot.userID]: 'evilLancelot',
        });
      }
    }

    if (this.actionHandler?.updateVisibleRoles) {
      this.actionHandler.updateVisibleRoles(owner, selectedPlayer);
    }
  }

  postAnnounceAction(ownerOfCheck: IPlayerInGame, selectedPlayer: IPlayerInGame): void {
    if (this.actionHandler) {
      this.actionHandler.postAnnounceAction(ownerOfCheck, selectedPlayer);
    }
  }
}
