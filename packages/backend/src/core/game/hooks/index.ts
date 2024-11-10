import { Observable, from, concatMap, take, scan, every } from 'rxjs';

import type { THooksDictionary, THookNames } from '@/core/game/hooks/interface';

export * from '@/core/game/hooks/interface';

export class GameHooks {
  hooks: THooksDictionary = {
    afterInit: { high: [], medium: [], low: [] },
    beforeSelectTeam: { high: [], medium: [], low: [] },
    afterSelectTeam: { high: [], medium: [], low: [] },
    beforeSentTeam: { high: [], medium: [], low: [] },
    afterSentTeam: { high: [], medium: [], low: [] },
    beforeVoteForTeam: { high: [], medium: [], low: [] },
    afterVoteForTeam: { high: [], medium: [], low: [] },
    beforeStartMission: { high: [], medium: [], low: [] },
    afterStartMission: { high: [], medium: [], low: [] },
    beforeEndMission: { high: [], medium: [], low: [] },
    afterEndMission: { high: [], medium: [], low: [] },
    beforeEndGame: { high: [], medium: [], low: [] },
  };

  callHook(hookName: THookNames): Observable<boolean> {
    const hooks = [...this.hooks[hookName].high, ...this.hooks[hookName].medium, ...this.hooks[hookName].low];

    return from(hooks).pipe(
      concatMap((fn) => fn().pipe(take(1))),
      scan((accumulatedValue, currentValue) => accumulatedValue && currentValue, true),
    );
  }

  callHooks(hookNameOrNames: THookNames | THookNames[], cb?: Function): void {
    const hooks = Array.isArray(hookNameOrNames) ? hookNameOrNames : [hookNameOrNames];

    from(hooks)
      .pipe(
        concatMap((str) => this.callHook(str)),
        every((result) => result === true),
      )
      .subscribe({
        next: (allTrue) => {
          if (allTrue) {
            cb?.();
          }
        },
      });
  }
}
