import * as _ from 'lodash';

import { IGameAddon, TAddonPriority } from '@/core/game/addons/interface';
import { CheckLoyaltyAbstractAddon } from '@/core/game/addons/check-loyalty';
import { Subject, of } from 'rxjs';
import { Game, IPlayerInGame } from '@/core/game';

export class WitchAddon extends CheckLoyaltyAbstractAddon implements IGameAddon {
  addonName = 'witch';
  featureName: CheckLoyaltyAbstractAddon['featureName'] = 'witchLoyalty';
  stageToCheck: CheckLoyaltyAbstractAddon['stageToCheck'] = 'witchLoyalty';
  featureValue: CheckLoyaltyAbstractAddon['featureValue'] = true;
  isUsed: boolean = false;
  game: Game;
  useWitchSubject: Subject<boolean> = new Subject();

  priority: TAddonPriority = {
    beforeEndMission: 'low',
  };

  constructor(game: Game) {
    super(game);
    this.game = game;
  }

  afterInit() {
    // On witch loyalty user with witch check can select players
    this.game.selectAvailable.witchLoyalty = (player) => player.features.witchLoyalty === true;

    return of(true);
  }

  beforeEndMission() {
    if (this.isUsed) {
      return of(true);
    }

    this.game.stage = 'witchAbility';
    this.game.stateObserver.gameStateChanged();

    return this.useWitchSubject.asObservable();
  }

  useWitchAbility(executorID: string, hide: boolean) {
    if (this.game.stage !== 'witchAbility') {
      throw new Error(`You cant use witch ability on stage ${this.game.stage}`);
    }

    const witch = this.game.players.find((player) => player.role.role === 'witch')!;

    if (witch.user.id !== executorID) {
      throw new Error('Only witch can use witch ability');
    }

    const mission = this.game.currentMission;

    if (hide === true) {
      this.isUsed = true;
      mission.hideMission();
      this.moveToWitchLoyalty();
    } else {
      this.useWitchSubject.next(true);
    }
  }

  postAnnounceAction(ownerOfCheck: IPlayerInGame, selectedPlayer: IPlayerInGame): void {
    ownerOfCheck.features.witchLoyalty = false;
    ownerOfCheck.features.waitForAction = false;
    selectedPlayer.features.isSelected = false;
    this.useWitchSubject.next(true);
  }

  moveToWitchLoyalty(): void {
    this.game.stage = 'witchLoyalty';

    // Generate witch loyalty checker
    const loyaltyChecker = _.sample(this.game.players.filter((player) => player.role.role !== 'witch'))!;

    loyaltyChecker.features.witchLoyalty = true;
    loyaltyChecker.features.waitForAction = true;

    this.game.stateObserver.gameStateChanged();
  }
}
