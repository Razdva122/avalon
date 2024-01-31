export class GameHooks {
  hooks = {
    afterInit: [],
    beforeSelectTeam: [],
    afterSelectTeam: [],
    beforeSentTeam: [],
    afterSentTeam: [],
    beforeVoteForTeam: [],
    afterVoteForTeam: [],
    beforeEndMission: [],
    afterEndMission: [],
    beforeEndGame: [],
  };

  callHook(hookName: string): boolean {
    for (const method of this.hooks[hookName]) {
      if (!method()) {
        return false;
      }
    }

    return true;
  }
}
