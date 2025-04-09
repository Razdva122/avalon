import type { HistoryElement, THistoryData } from '@/core/game/history';
import type { THistoryStage, TLoyalty, CheckLoyalty, RevealLoyalty, AnnounceLoyalty, TRoles } from '@avalon/types';
import type { IPlayerInGame } from '@/core/game';
import type { TDataForManagerOptions } from '@/core/game/history';

export class CheckLoyaltyHistory implements HistoryElement<'checkLoyalty'> {
  type = 'checkLoyalty' as const;
  data: THistoryData['checkLoyalty'];
  stage: THistoryStage;
  canBeHidden: boolean = true;

  constructor(validator: IPlayerInGame, inspected: IPlayerInGame) {
    this.data = {
      validator,
      inspected,
    };

    this.stage = 'finished';
  }

  dataForManager() {
    const validatorID = this.data.validator.user.id;
    const inspectedID = this.data.inspected.user.id;

    const checkLoyaltyData: CheckLoyalty = {
      type: this.type,
      validatorID: validatorID,
      inspectedID: inspectedID,
    };

    return checkLoyaltyData;
  }
}

export class RevealLoyaltyHistory implements HistoryElement<'revealLoyalty'> {
  type = 'revealLoyalty' as const;
  data: THistoryData['revealLoyalty'];
  stage: THistoryStage;
  canBeHidden: boolean = true;

  constructor(revealer: IPlayerInGame, target: IPlayerInGame) {
    this.data = {
      revealer,
      target,
    };

    this.stage = 'finished';
  }

  dataForManager() {
    const revealerID = this.data.revealer.user.id;
    const targetID = this.data.target.user.id;

    const revealLoyaltyData: RevealLoyalty = {
      type: this.type,
      revealerID: revealerID,
      targetID: targetID,
    };

    return revealLoyaltyData;
  }
}

export class AnnounceLoyaltyHistory implements HistoryElement<'announceLoyalty'> {
  type = 'announceLoyalty' as const;
  data: THistoryData['announceLoyalty'];
  stage: THistoryStage;
  canBeHidden: boolean = true;

  constructor(
    announcer: IPlayerInGame,
    target: IPlayerInGame,
    announced: TLoyalty | TRoles,
    actual: TLoyalty | TRoles,
  ) {
    this.data = {
      announcer,
      target,
      announced,
      actual,
    };

    this.stage = 'finished';
  }

  dataForManager(options: TDataForManagerOptions) {
    const announcerID = this.data.announcer.user.id;
    const targetID = this.data.target.user.id;

    const announceLoyaltyData: AnnounceLoyalty = {
      type: this.type,
      announced: this.data.announced,
      actual: this.data.actual,
      announcerID: announcerID,
      targetID: targetID,
    };

    if (options.game.stage === 'end' || options.userID === announcerID || options.userID === targetID) {
      return announceLoyaltyData;
    }

    delete announceLoyaltyData['actual'];

    return announceLoyaltyData;
  }
}
