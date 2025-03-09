/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ClientToServerEvents } from './sockets';

export type ArgumentOfCallback<K extends keyof ClientToServerEvents> = ClientToServerEvents[K] extends (
  ...args: any[]
) => any
  ? Parameters<ClientToServerEvents[K]> extends [...any, (arg: infer Arg) => void]
    ? Arg
    : never
  : never;
