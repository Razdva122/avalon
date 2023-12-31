import type { IMissionSettings, TMissionResult } from '@avalon/types';

export interface IMissionWithResult extends IMissionSettings {
  result?: TMissionResult;
}
