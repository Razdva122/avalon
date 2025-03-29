import { THistoryResults } from '@avalon/types';

import last from 'lodash/last';

export function calculateVisualElement(history: THistoryResults[]): { element?: THistoryResults; timeout: number } {
  const lastElement = last(history);

  if (
    lastElement?.type === 'vote' ||
    lastElement?.type === 'preVote' ||
    (lastElement?.type === 'checkLoyalty' && lastElement.result) ||
    lastElement?.type === 'mission' ||
    lastElement?.type === 'switchLancelots' ||
    lastElement?.type === 'ambush'
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
