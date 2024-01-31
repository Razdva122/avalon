import type { THooksDictionary, THookNames } from '@/core/game/hooks/interface';

export * from '@/core/game/hooks/interface';

export class GameHooks {
  hooks: THooksDictionary = {
    afterInit: [],
    beforeSelectTeam: [],
    afterSelectTeam: [],
    beforeSentTeam: [],
    afterSentTeam: [],
    beforeVoteForTeam: [],
    afterVoteForTeam: [],
    beforeStartMission: [],
    afterStartMission: [],
    beforeEndMission: [],
    afterEndMission: [],
    beforeEndGame: [],
  };

  callHook(hookName: THookNames): boolean {
    for (const method of this.hooks[hookName]) {
      if (!method()) {
        return false;
      }
    }

    return true;
  }
}
