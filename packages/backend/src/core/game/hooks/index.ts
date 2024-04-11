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
    let result = true;

    for (const method of this.hooks[hookName]) {
      if (!method()) {
        result = false;
      }
    }

    return result;
  }
}
