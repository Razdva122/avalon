import { THistoryResults } from '@avalon/types';

import * as _ from 'lodash';

export function calculateVisualElement(history: THistoryResults[]): { element?: THistoryResults; timeout: number } {
  const lastElement = _.last(history);

  if (
    lastElement?.type === 'vote' ||
    (lastElement?.type === 'checkLoyalty' && lastElement.result) ||
    lastElement?.type === 'mission' ||
    (lastElement?.type === 'switchLancelots' && lastElement.result)
  ) {
    return {
      element: lastElement,
      timeout: 10000,
    };
  }

  if (lastElement?.type === 'switchResult' && lastElement.targetID) {
    return {
      element: lastElement,
      timeout: 0,
    };
  }

  return {
    timeout: 0,
  };
}
